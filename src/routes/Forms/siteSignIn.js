// routes/siteSignIn.js - FIXED VERSION
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create optional auth middleware for public routes
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  try {
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        try {
          // Verify token if provided
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = {
            userId: decoded.userId,
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            companyId: decoded.companyId
          };
        } catch (tokenError) {
          // Token invalid, but continue without user
          console.log('Invalid token provided, continuing without auth:', tokenError.message);
        }
      }
    }
    
    // Continue regardless of auth status
    next();

  } catch (error) {
    // Log error but continue
    console.log('Auth error, continuing without auth:', error.message);
    next();
  }
};

// PUBLIC ROUTES (no auth required)

// GET /api/site-signin/form/:formId - Get form details by form ID (PUBLIC ACCESS)
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    console.log('🔍 Looking for form with ID:', formId);

    // Find the form and get company details
    const form = await prisma.siteSignInForm.findUnique({
      where: { id: formId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            isActive: true
          }
        }
      }
    });

    console.log('📋 Found form:', form ? 'Yes' : 'No');

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'The requested form does not exist'
      });
    }

    if (form.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Form inactive',
        message: 'This form is currently inactive and cannot accept submissions'
      });
    }

    if (!form.company.isActive) {
      return res.status(403).json({
        error: 'Company inactive',
        message: 'This company account is currently inactive'
      });
    }

    // Return form details (without sensitive company info)
    res.json({
      success: true,
      data: {
        formId: form.id,
        formName: form.formName,
        description: form.description,
        companyName: form.company.name,
        companySubdomain: form.company.subdomain,
        status: form.status
      }
    });

  } catch (error) {
    console.error('Error fetching form details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch form details'
    });
  }
});

// POST /api/site-signin/:formId - Create new sign-in submission (PUBLIC ACCESS with optional auth)
router.post('/:formId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { formId } = req.params;
    const {
      jobSiteId,
      workerName,
      signInTime,
      signOutTime,
      expectedHours,
      emergencyContactNumber,
      healthStatus,
      ppeCompliance,
      comments,
      workerEmail
    } = req.body;

    console.log('📝 Creating submission for form:', formId);
    console.log('👤 User authenticated:', !!req.user);

    // Validation
    if (!workerName || !emergencyContactNumber || !healthStatus) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'workerName, emergencyContactNumber, and healthStatus are required'
      });
    }

    // Find the form and get the company ID from it
    const form = await prisma.siteSignInForm.findUnique({
      where: { id: formId },
      include: {
        company: {
          select: {
            id: true,
            isActive: true,
            name: true
          }
        }
      }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Site sign-in form not found'
      });
    }

    if (form.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Form inactive',
        message: 'This form is currently inactive and cannot accept submissions'
      });
    }

    if (!form.company.isActive) {
      return res.status(403).json({
        error: 'Company inactive',
        message: 'This company account is currently inactive'
      });
    }

    // Get company ID from the form
    const companyId = form.companyId;

    // For user ID, either get from auth (if authenticated) or try to find by email
    let userId = null;
    
    // If user is authenticated, use their ID
    if (req.user) {
      userId = req.user.userId;
      console.log('🔐 Using authenticated user ID:', userId);
    } else if (workerEmail) {
      // Try to find existing user in the company by email
      const existingUser = await prisma.user.findFirst({
        where: {
          email: workerEmail,
          companyId: companyId
        }
      });
      
      if (existingUser) {
        userId = existingUser.id;
        console.log('📧 Found user by email:', userId);
      } else {
        console.log('👤 No user found, creating guest submission');
      }
    }

    // Calculate total hours if signing out
    let totalHours = null;
    if (signOutTime && signInTime) {
      const diffMs = new Date(signOutTime) - new Date(signInTime);
      totalHours = diffMs / (1000 * 60 * 60);
    }

    // Determine status
    const status = signOutTime ? 'COMPLETED' : 'ACTIVE';

    // Create submission
    const submission = await prisma.siteSignInSubmission.create({
      data: {
        companyId,
        formId,
        userId, // Can be null for guest submissions
        jobSiteId,
        workerName,
        signInTime: new Date(signInTime),
        signOutTime: signOutTime ? new Date(signOutTime) : null,
        totalHours,
        expectedHours: expectedHours ? parseFloat(expectedHours) : null,
        emergencyContactNumber,
        healthStatus: healthStatus.toUpperCase(),
        ppeCompliance: ppeCompliance || {},
        comments,
        status
      },
      include: {
        form: {
          select: { formName: true }
        },
        company: {
          select: { name: true }
        }
      }
    });

    // Update form submission count
    await prisma.siteSignInForm.update({
      where: { id: formId },
      data: {
        submissionCount: { increment: 1 }
      }
    });

    console.log('✅ Submission created successfully:', submission.id);

    res.status(201).json({
      success: true,
      message: status === 'COMPLETED' ? 'Successfully signed out' : 'Successfully signed in',
      data: submission
    });

  } catch (error) {
    console.error('Error creating site sign-in submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process sign-in submission'
    });
  }
});

// PROTECTED ROUTES (require authentication)
router.use(authMiddleware);

// GET /api/site-signin - Get all sign-in submissions for the company
router.get('/', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      jobSiteId, 
      startDate, 
      endDate 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      companyId,
      ...(status && { status }),
      ...(jobSiteId && { jobSiteId }),
      ...(startDate && endDate && {
        signInTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.siteSignInSubmission.findMany({
        where,
        include: {
          form: {
            select: { formName: true }
          },
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { signInTime: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.siteSignInSubmission.count({ where })
    ]);

    res.json({
      success: true,
      data: submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching site sign-in submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// GET /api/site-signin/:id - Get specific submission
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const submission = await prisma.siteSignInSubmission.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        form: {
          select: { formName: true, description: true }
        },
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Site sign-in submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching site sign-in submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
});

// PUT /api/site-signin/:id - Update submission (for sign-out)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const { signOutTime, comments } = req.body;

    // Find existing submission
    const existingSubmission = await prisma.siteSignInSubmission.findFirst({
      where: {
        id,
        companyId,
        status: 'ACTIVE'
      }
    });

    if (!existingSubmission) {
      return res.status(404).json({
        error: 'Active submission not found',
        message: 'No active sign-in found to update'
      });
    }

    // Calculate total hours
    let totalHours = null;
    if (signOutTime && existingSubmission.signInTime) {
      const diffMs = new Date(signOutTime) - new Date(existingSubmission.signInTime);
      totalHours = diffMs / (1000 * 60 * 60);
    }

    // Update submission
    const updatedSubmission = await prisma.siteSignInSubmission.update({
      where: { id },
      data: {
        signOutTime: signOutTime ? new Date(signOutTime) : null,
        totalHours,
        comments: comments || existingSubmission.comments,
        status: signOutTime ? 'COMPLETED' : 'ACTIVE'
      },
      include: {
        form: {
          select: { formName: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Successfully updated sign-in record',
      data: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating site sign-in submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update submission'
    });
  }
});

// GET /api/site-signin/active/:userId - Get active sign-in for a user
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId } = req.user;

    const activeSignIn = await prisma.siteSignInSubmission.findFirst({
      where: {
        userId,
        companyId,
        status: 'ACTIVE'
      },
      include: {
        form: {
          select: { formName: true }
        }
      },
      orderBy: { signInTime: 'desc' }
    });

    res.json({
      success: true,
      data: activeSignIn
    });

  } catch (error) {
    console.error('Error fetching active sign-in:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch active sign-in'
    });
  }
});

// GET /api/site-signin/stats - Get sign-in statistics
router.get('/stats/dashboard', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalToday,
      activeToday,
      completedToday,
      totalThisWeek,
      avgHoursToday
    ] = await Promise.all([
      // Total sign-ins today
      prisma.siteSignInSubmission.count({
        where: {
          companyId,
          signInTime: { gte: today }
        }
      }),
      // Currently active (signed in but not out)
      prisma.siteSignInSubmission.count({
        where: {
          companyId,
          status: 'ACTIVE',
          signInTime: { gte: today }
        }
      }),
      // Completed today
      prisma.siteSignInSubmission.count({
        where: {
          companyId,
          status: 'COMPLETED',
          signInTime: { gte: today }
        }
      }),
      // Total this week
      prisma.siteSignInSubmission.count({
        where: {
          companyId,
          signInTime: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // Average hours today
      prisma.siteSignInSubmission.aggregate({
        where: {
          companyId,
          signInTime: { gte: today },
          totalHours: { not: null }
        },
        _avg: { totalHours: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        today: {
          total: totalToday,
          active: activeToday,
          completed: completedToday,
          averageHours: avgHoursToday._avg.totalHours || 0
        },
        thisWeek: {
          total: totalThisWeek
        }
      }
    });

  } catch (error) {
    console.error('Error fetching sign-in stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;