// routes/chat.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: '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',
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Helper function to get relevant knowledge for user's state
async function getRelevantKnowledge(userState, query, limit = 3) {
  try {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    const knowledge = await prisma.knowledgeBase.findMany({
      where: {
        isActive: true,
        state: userState,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { keywords: { hasSome: searchTerms } }
        ]
      },
      select: {
        title: true,
        summary: true,
        content: true,
        sourceUrl: true,
        category: true
      },
      orderBy: { lastUpdated: 'desc' },
      take: limit
    });

    return knowledge;
  } catch (error) {
    console.error('Error fetching relevant knowledge:', error);
    return [];
  }
}

// Helper function to get chat history
async function getChatHistory(sessionId, limit = 10) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      take: limit,
      select: {
        role: true,
        content: true,
        timestamp: true
      }
    });

    return messages.map(msg => ({
      role: msg.role.toLowerCase(),
      content: msg.content
    }));
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

// Helper function to create system prompt
function createSystemPrompt(userState, relevantKnowledge) {
  const knowledgeContext = relevantKnowledge.map(k => 
    `Title: ${k.title}\nSummary: ${k.summary || k.content.substring(0, 300)}\nSource: ${k.sourceUrl}`
  ).join('\n\n');

  return `You are Ellie, a friendly and knowledgeable AI assistant specializing in workplace health and safety regulations for ${userState}, Australia.

Your role:
- Provide accurate, helpful information about workplace safety regulations and compliance
- Be conversational and approachable while maintaining professionalism
- Always cite sources when providing specific regulatory information
- If you're unsure about something, acknowledge it and suggest consulting official sources
- Focus on practical, actionable advice

Available Knowledge Base for ${userState}:
${knowledgeContext || 'No specific knowledge base available for this query.'}

Guidelines:
- Keep responses concise but comprehensive
- Use bullet points for complex information
- Always mention if users should consult official sources for legal compliance
- Be encouraging and supportive about workplace safety
- If the question is outside workplace safety, politely redirect to safety topics`;
}

// POST /api/chat - Send a message to the AI assistant
router.post('/', async (req, res) => {
  try {
    const { message, sessionId, userState } = req.body;
    const { companyId, userId } = req.user;

    if (!message || !sessionId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Message and sessionId are required'
      });
    }

    // Get or create chat session
    let session = await prisma.chatSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      // Determine user state from company or request
      let determinedState = userState;
      if (!determinedState) {
        const company = await prisma.company.findUnique({
          where: { id: companyId },
          select: { companyState: true }
        });
        determinedState = company?.companyState || 'victoria'; // Default to Victoria
      }

      session = await prisma.chatSession.create({
        data: {
          sessionId,
          companyId,
          userId,
          userState: determinedState
        }
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: message
      }
    });

    // Get relevant knowledge and chat history
    const [relevantKnowledge, chatHistory] = await Promise.all([
      getRelevantKnowledge(session.userState, message),
      getChatHistory(sessionId, 10)
    ]);

    // Create messages for OpenAI
    const systemPrompt = createSystemPrompt(session.userState, relevantKnowledge);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-8), // Keep last 8 messages for context
      { role: 'user', content: message }
    ];

    // Get AI response
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const responseTime = Date.now() - startTime;
    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error generating a response.';

    // Save AI response
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: aiResponse,
        metadata: {
          model: 'gpt-4',
          tokensUsed: completion.usage?.total_tokens || 0,
          knowledgeSourcesUsed: relevantKnowledge.length,
          relevantSources: relevantKnowledge.map(k => k.sourceUrl)
        },
        tokensUsed: completion.usage?.total_tokens || 0,
        responseTime
      }
    });

    res.json({
      success: true,
      data: {
        response: aiResponse,
        sessionId,
        userState: session.userState,
        sourcesUsed: relevantKnowledge.map(k => ({
          title: k.title,
          url: k.sourceUrl
        }))
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process chat message'
    });
  }
});

// GET /api/chat/session/:sessionId - Get chat history for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { companyId } = req.user;

    // Verify session belongs to user's company
    const session = await prisma.chatSession.findFirst({
      where: {
        sessionId,
        companyId
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Chat session not found'
      });
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        timestamp: true,
        metadata: true
      }
    });

    res.json({
      success: true,
      data: {
        session: {
          sessionId: session.sessionId,
          userState: session.userState,
          createdAt: session.createdAt
        },
        messages
      }
    });

  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch chat session'
    });
  }
});

// GET /api/chat/sessions - Get all chat sessions for user's company
router.get('/sessions', async (req, res) => {
  try {
    const { companyId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where: {
          companyId,
          isActive: true
        },
        include: {
          _count: {
            select: { messages: true }
          },
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              content: true,
              timestamp: true,
              role: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.chatSession.count({
        where: {
          companyId,
          isActive: true
        }
      })
    ]);

    const formattedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      userState: session.userState,
      messageCount: session._count.messages,
      lastMessage: session.messages[0] || null,
      user: session.user,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));

    res.json({
      success: true,
      data: formattedSessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch chat sessions'
    });
  }
});

// POST /api/chat/session/new - Create a new chat session
router.post('/session/new', async (req, res) => {
  try {
    const { userState } = req.body;
    const { companyId, userId } = req.user;

    let determinedState = userState;
    if (!determinedState) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { companyState: true }
      });
      determinedState = company?.companyState || 'victoria';
    }

    const sessionId = uuidv4();

    const session = await prisma.chatSession.create({
      data: {
        sessionId,
        companyId,
        userId,
        userState: determinedState
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        userState: session.userState
      }
    });

  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create chat session'
    });
  }
});

// DELETE /api/chat/session/:sessionId - Delete a chat session
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { companyId } = req.user;

    // Verify session belongs to user's company
    const session = await prisma.chatSession.findFirst({
      where: {
        sessionId,
        companyId
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Chat session not found'
      });
    }

    // Soft delete - set isActive to false
    await prisma.chatSession.update({
      where: { sessionId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete chat session'
    });
  }
});

// GET /api/chat/stats - Get chat usage statistics
router.get('/stats', async (req, res) => {
  try {
    const { companyId } = req.user;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalSessions,
      totalMessages,
      monthlyMessages,
      averageResponseTime,
      topicsDiscussed
    ] = await Promise.all([
      // Total sessions
      prisma.chatSession.count({
        where: { companyId, isActive: true }
      }),

      // Total messages
      prisma.chatMessage.count({
        where: {
          session: { companyId }
        }
      }),

      // Monthly messages
      prisma.chatMessage.count({
        where: {
          session: { companyId },
          timestamp: { gte: thirtyDaysAgo }
        }
      }),

      // Average response time
      prisma.chatMessage.aggregate({
        where: {
          session: { companyId },
          role: 'ASSISTANT',
          responseTime: { not: null }
        },
        _avg: { responseTime: true }
      }),

      // Most discussed topics (based on token usage)
      prisma.chatMessage.groupBy({
        by: ['session'],
        where: {
          session: { companyId },
          role: 'ASSISTANT'
        },
        _sum: { tokensUsed: true },
        _count: { id: true },
        orderBy: { _sum: { tokensUsed: 'desc' } },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        totalSessions,
        totalMessages,
        monthlyMessages,
        averageResponseTime: Math.round(averageResponseTime._avg?.responseTime || 0),
        topicsDiscussed: topicsDiscussed.length
      }
    });

  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch chat statistics'
    });
  }
});

// GET /api/chat/user-state - Get user's state for chat context
router.get('/user-state', async (req, res) => {
  try {
    const { companyId } = req.user;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        companyState: true,
        name: true,
        city: true,
        state: true
      }
    });

    if (!company) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Company not found'
      });
    }

    // Determine state from company data
    let userState = company.companyState || company.state || 'victoria';

    // Map common state abbreviations to full names
    const stateMapping = {
      'VIC': 'victoria',
      'NSW': 'new_south_wales', 
      'QLD': 'queensland',
      'SA': 'south_australia',
      'WA': 'western_australia',
      'TAS': 'tasmania',
      'NT': 'northern_territory',
      'ACT': 'australian_capital_territory'
    };

    if (stateMapping[userState?.toUpperCase()]) {
      userState = stateMapping[userState.toUpperCase()];
    }

    res.json({
      success: true,
      data: {
        userState: userState.toLowerCase().replace(/\s+/g, '_'),
        companyName: company.name,
        companyLocation: company.city
      }
    });

  } catch (error) {
    console.error('Error fetching user state:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user state'
    });
  }
});

module.exports = router;