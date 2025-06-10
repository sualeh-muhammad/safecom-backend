// routes/knowledgeBase.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const KnowledgeScraper = require('../services/knowledgeScraper');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/knowledge-base - Get all knowledge base entries with filtering
router.get('/', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { 
      state, 
      category, 
      page = 1, 
      limit = 10, 
      search 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      isActive: true,
      ...(state && { state }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { keywords: { has: search } }
        ]
      })
    };

    // Get data with pagination
    const [entries, total] = await Promise.all([
      prisma.knowledgeBase.findMany({
        where,
        select: {
          id: true,
          state: true,
          category: true,
          title: true,
          summary: true,
          sourceUrl: true,
          keywords: true,
          lastUpdated: true,
          version: true
        },
        orderBy: { lastUpdated: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.knowledgeBase.count({ where })
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch knowledge base entries'
    });
  }
});

// GET /api/knowledge-base/stats - Get knowledge base statistics
router.get('/stats', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const [
      totalEntries,
      stateStats,
      categoryStats,
      recentUpdates
    ] = await Promise.all([
      // Total entries
      prisma.knowledgeBase.count({ where: { isActive: true } }),
      
      // Stats by state
      prisma.knowledgeBase.groupBy({
        by: ['state'],
        where: { isActive: true },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      
      // Stats by category
      prisma.knowledgeBase.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { id: true }
      }),
      
      // Recent updates
      prisma.knowledgeBase.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          state: true,
          lastUpdated: true
        },
        orderBy: { lastUpdated: 'desc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        totalEntries,
        stateStats: stateStats.map(s => ({
          state: s.state,
          count: s._count.id
        })),
        categoryStats: categoryStats.map(c => ({
          category: c.category,
          count: c._count.id
        })),
        recentUpdates
      }
    });

  } catch (error) {
    console.error('Error fetching knowledge base stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics'
    });
  }
});

// POST /api/knowledge-base/scrape-state - Start scraping for a specific state
router.post('/scrape-state', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { state, category = 'whs-acts-regulations', customUrls } = req.body;

    if (!state) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'State is required'
      });
    }

    // Get URLs for the state
    const stateUrls = KnowledgeScraper.getStateUrls();
    const urls = customUrls || stateUrls[state];

    if (!urls || urls.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: `No URLs configured for state: ${state}`
      });
    }

    // Create import job
    const job = await prisma.knowledgeImportJob.create({
      data: {
        state,
        category,
        urls,
        totalUrls: urls.length,
        status: 'PENDING'
      }
    });

    // Start scraping in background
    const scraper = new KnowledgeScraper();
    
    // Don't await - let it run in background
    scraper.scrapeStateData(state, urls, category, job.id)
      .catch(error => {
        console.error('Background scraping error:', error);
        // Update job status to failed
        prisma.knowledgeImportJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorLog: error.message,
            completedAt: new Date()
          }
        }).catch(console.error);
      });

    res.json({
      success: true,
      message: 'Scraping job started',
      data: {
        jobId: job.id,
        state,
        totalUrls: urls.length
      }
    });

  } catch (error) {
    console.error('Error starting scrape job:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to start scraping job'
    });
  }
});

// GET /api/knowledge-base/jobs - Get import job status
router.get('/jobs', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { jobId, state, status } = req.query;

    const where = {
      ...(jobId && { id: jobId }),
      ...(state && { state }),
      ...(status && { status })
    };

    const jobs = await prisma.knowledgeImportJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: jobs
    });

  } catch (error) {
    console.error('Error fetching import jobs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch import jobs'
    });
  }
});

// GET /api/knowledge-base/job/:jobId - Get specific job status
router.get('/job/:jobId', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.knowledgeImportJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Import job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('Error fetching import job:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch import job'
    });
  }
});

// DELETE /api/knowledge-base/:id - Delete knowledge base entry
router.delete('/:id', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.knowledgeBase.findUnique({
      where: { id }
    });

    if (!entry) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Knowledge base entry not found'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.knowledgeBase.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Knowledge base entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting knowledge base entry:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete knowledge base entry'
    });
  }
});

// POST /api/knowledge-base/refresh-state - Refresh all data for a state
router.post('/refresh-state', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'State is required'
      });
    }

    // Deactivate existing entries for the state
    await prisma.knowledgeBase.updateMany({
      where: { state, isActive: true },
      data: { isActive: false }
    });

    // Start fresh scraping
    const stateUrls = KnowledgeScraper.getStateUrls();
    const urls = stateUrls[state];

    if (!urls || urls.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: `No URLs configured for state: ${state}`
      });
    }

    // Create new import job
    const job = await prisma.knowledgeImportJob.create({
      data: {
        state,
        category: 'whs-acts-regulations',
        urls,
        totalUrls: urls.length,
        status: 'PENDING'
      }
    });

    // Start scraping
    const scraper = new KnowledgeScraper();
    scraper.scrapeStateData(state, urls, 'whs-acts-regulations', job.id)
      .catch(error => {
        console.error('Background refresh error:', error);
        prisma.knowledgeImportJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            errorLog: error.message,
            completedAt: new Date()
          }
        }).catch(console.error);
      });

    res.json({
      success: true,
      message: 'State data refresh started',
      data: {
        jobId: job.id,
        state
      }
    });

  } catch (error) {
    console.error('Error refreshing state data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh state data'
    });
  }
});

// GET /api/knowledge-base/search - Search knowledge base
router.get('/search', async (req, res) => {
  try {
    const { query, state, limit = 5 } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Search query is required'
      });
    }

    const where = {
      isActive: true,
      ...(state && { state }),
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { keywords: { hasSome: query.split(' ') } }
      ]
    };

    const results = await prisma.knowledgeBase.findMany({
      where,
      select: {
        id: true,
        title: true,
        summary: true,
        sourceUrl: true,
        state: true,
        category: true
      },
      take: parseInt(limit),
      orderBy: [
        { lastUpdated: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error searching knowledge base:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search knowledge base'
    });
  }
});

module.exports = router;