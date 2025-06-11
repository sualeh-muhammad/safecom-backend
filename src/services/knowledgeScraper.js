// services/knowledgeScraper.js
const cheerio = require('cheerio');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: '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',
});

class KnowledgeScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.timeout = 30000; // 30 seconds
    this.maxRetries = 3;
  }

  async scrapeStateData(state, urls, category = 'whs-acts-regulations', jobId = null) {
    console.log(`🚀 Starting knowledge scraping for ${state}`);
    
    let job;
    if (jobId) {
      job = await prisma.knowledgeImportJob.findUnique({
        where: { id: jobId }
      });
    }

    const results = {
      success: [],
      failed: [],
      totalProcessed: 0
    };

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      try {
        console.log(`📄 Processing URL ${i + 1}/${urls.length}: ${url}`);
        
        // Update job progress
        if (job) {
          await this.updateJobProgress(jobId, i, urls.length);
        }

        const scrapedData = await this.scrapeUrl(url, state, category);
        
        if (scrapedData) {
          // Save to database
          const savedData = await this.saveKnowledgeData(scrapedData);
          results.success.push({
            url,
            id: savedData.id,
            title: savedData.title
          });
          
          console.log(`✅ Successfully processed: ${scrapedData.title}`);
        } else {
          results.failed.push({ url, error: 'No content extracted' });
        }

      } catch (error) {
        console.error(`❌ Failed to process ${url}:`, error.message);
        results.failed.push({ url, error: error.message });
      }
      
      results.totalProcessed++;
      
      // Add delay to be respectful to servers
      if (i < urls.length - 1) {
        await this.delay(2000); // 2 second delay between requests
      }
    }

    // Final job update
    if (job) {
      await this.completeJob(jobId, results);
    }

    console.log(`🎉 Scraping completed for ${state}. Success: ${results.success.length}, Failed: ${results.failed.length}`);
    return results;
  }

  async scrapeUrl(url, state, category) {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
          },
          timeout: this.timeout,
          maxRedirects: 5
        });

        const $ = cheerio.load(response.data);
        
        // Extract content
        const extractedData = this.extractContent($, url, state, category);
        
        if (extractedData && extractedData.content.length > 100) {
          // Generate AI summary and keywords
          const aiEnhanced = await this.enhanceWithAI(extractedData);
          return aiEnhanced;
        }
        
        return null;

      } catch (error) {
        retries++;
        console.warn(`⚠️ Retry ${retries}/${this.maxRetries} for ${url}: ${error.message}`);
        
        if (retries >= this.maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await this.delay(1000 * Math.pow(2, retries));
      }
    }
  }

  extractContent($, url, state, category) {
    try {
      // Remove unwanted elements
      $('script, style, nav, footer, .nav, .menu, .sidebar, .header, .advertisement, .ads, .social-share').remove();
      $('[class*="nav"], [class*="menu"], [class*="footer"], [class*="header"], [class*="sidebar"]').remove();
      $('iframe, object, embed').remove();
      
      // Extract title
      let title = $('h1').first().text().trim();
      if (!title) {
        title = $('title').text().trim();
      }
      if (!title) {
        title = $('h2').first().text().trim();
      }
      
      // Extract main content
      let content = '';
      
      // Try different content selectors
      const contentSelectors = [
        'main',
        '.main-content',
        '.content',
        '.article-content',
        '.post-content',
        '.entry-content',
        'article',
        '.article',
        '[role="main"]',
        '#content',
        '#main-content'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length && element.text().trim().length > content.length) {
          content = element.text().trim();
        }
      }
      
      // Fallback to body if no specific content area found
      if (!content || content.length < 100) {
        content = $('body').text().trim();
      }
      
      // Clean up content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      // Extract headings for structure
      const headings = [];
      $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 3) {
          headings.push(text);
        }
      });

      return {
        title: title || 'Untitled Document',
        content,
        headings,
        state,
        category,
        sourceUrl: url,
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Content extraction error:', error);
      return null;
    }
  }

  async enhanceWithAI(extractedData) {
    try {
      // Generate summary
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert in workplace health and safety. Summarize the following document in 2-3 paragraphs, focusing on key regulations, requirements, and practical implications."
          },
          {
            role: "user",
            content: `Document Title: ${extractedData.title}\n\nContent: ${extractedData.content.substring(0, 4000)}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      // Generate keywords
      const keywordsResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Extract 10-15 relevant keywords and phrases from this workplace safety document. Return only the keywords separated by commas."
          },
          {
            role: "user",
            content: `${extractedData.title}\n\n${extractedData.content.substring(0, 2000)}`
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      const summary = summaryResponse.choices[0]?.message?.content || '';
      const keywordsText = keywordsResponse.choices[0]?.message?.content || '';
      const keywords = keywordsText.split(',').map(k => k.trim()).filter(k => k.length > 2);

      return {
        ...extractedData,
        summary,
        keywords
      };

    } catch (error) {
      console.warn('AI enhancement failed:', error.message);
      // Return original data without AI enhancement
      return {
        ...extractedData,
        summary: '',
        keywords: []
      };
    }
  }

  async saveKnowledgeData(data) {
    try {
      // Check if similar content already exists
      const existing = await prisma.knowledgeBase.findFirst({
        where: {
          state: data.state,
          sourceUrl: data.sourceUrl,
          isActive: true
        }
      });

      if (existing) {
        // Update existing record
        return await prisma.knowledgeBase.update({
          where: { id: existing.id },
          data: {
            title: data.title,
            content: data.content,
            summary: data.summary,
            keywords: data.keywords,
            lastUpdated: new Date(),
            version: existing.version + 1
          }
        });
      } else {
        // Create new record
        return await prisma.knowledgeBase.create({
          data: {
            state: data.state,
            category: data.category,
            title: data.title,
            content: data.content,
            sourceUrl: data.sourceUrl,
            summary: data.summary,
            keywords: data.keywords
          }
        });
      }

    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  }

  async updateJobProgress(jobId, processed, total) {
    try {
      await prisma.knowledgeImportJob.update({
        where: { id: jobId },
        data: {
          progress: Math.round((processed / total) * 100),
          processedUrls: processed,
          status: 'IN_PROGRESS'
        }
      });
    } catch (error) {
      console.error('Job progress update error:', error);
    }
  }

  async completeJob(jobId, results) {
    try {
      await prisma.knowledgeImportJob.update({
        where: { id: jobId },
        data: {
          status: results.failed.length === 0 ? 'COMPLETED' : 'COMPLETED',
          progress: 100,
          processedUrls: results.totalProcessed,
          successUrls: results.success.length,
          failedUrls: results.failed.length,
          errorLog: results.failed.length > 0 ? JSON.stringify(results.failed) : null,
          completedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Job completion error:', error);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Predefined URLs for Australian states
  static getStateUrls() {
    return {
      victoria: [
        'https://www.worksafe.vic.gov.au/occupational-health-and-safety-act-and-regulations',
        'https://www.worksafe.vic.gov.au/'
      ],
      queensland: [
        'https://www.worksafe.qld.gov.au/laws-and-compliance/work-health-and-safety-laws',
        'https://www.worksafe.qld.gov.au/'
      ],
      south_australia: [
        'https://www.safework.sa.gov.au/'
      ],
      western_australia: [
        'https://www.worksafe.wa.gov.au/laws-and-regulations',
        'https://www.worksafe.wa.gov.au/'
      ],
      tasmania: [
        'https://worksafe.tas.gov.au/topics/laws-and-compliance',
        'https://www.cbos.tas.gov.au/topics/technical-regulation'
      ],
      northern_territory: [
        'https://worksafe.nt.gov.au/laws-and-compliance/workplace-safety-laws',
        'https://www.worksafe.nt.gov.au/'
      ],
      australian_capital_territory: [
        'https://www.worksafe.act.gov.au/laws-and-compliance',
        'https://www.worksafe.act.gov.au/'
      ]
    };
  }
}

module.exports = KnowledgeScraper;