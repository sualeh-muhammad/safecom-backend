const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const PDFDocument = require('pdfkit');

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

// GET /api/psychosocial-hazard/form/:formId - Get form details by form ID (PUBLIC ACCESS)
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    console.log('🔍 Looking for psychosocial hazard form with ID:', formId);

    // Find the form and get company details
    const form = await prisma.psychosocialHazardForm.findUnique({
      where: { id: formId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            isActive: true,
            logoImageUrl: true
          }
        }
      }
    });

    console.log('📋 Found form:', form ? 'Yes' : 'No');

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'The requested psychosocial hazard form does not exist'
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
        company: {
          name: form.company.name,
          subdomain: form.company.subdomain,
          logoImageUrl: form.company.logoImageUrl
        },
        status: form.status
      }
    });

  } catch (error) {
    console.error('Error fetching psychosocial hazard form details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch form details'
    });
  }
});

// POST /api/psychosocial-hazard/:formId - Create new submission (PUBLIC ACCESS with optional auth)
router.post('/:formId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { formId } = req.params;
    const {
      firstName,
      lastName,
      description,
      submittedAt
    } = req.body;

    console.log('📝 Creating psychosocial hazard submission for form:', formId);
    console.log('👤 User authenticated:', !!req.user);

    // Validation
    if (!description || !description.trim()) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Description is required'
      });
    }

    // Find the form and get the company ID from it
    const form = await prisma.psychosocialHazardForm.findUnique({
      where: { id: formId },
      include: {
        company: {
          select: {
            id: true,
            isActive: true,
            name: true,
            logoImageUrl: true
          }
        }
      }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Psychosocial hazard form not found'
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

    // For user ID, either get from auth (if authenticated) or leave as null
    let userId = null;
    
    // If user is authenticated, use their ID
    if (req.user) {
      userId = req.user.userId;
      console.log('🔐 Using authenticated user ID:', userId);
    } else {
      console.log('👤 Creating anonymous submission');
    }

    // Create submission
    const submission = await prisma.psychosocialHazardSubmission.create({
      data: {
        companyId,
        formId,
        userId, // Can be null for anonymous submissions
        firstName: firstName || 'Anonymous',
        lastName: lastName || 'User',
        description: description.trim(),
        submittedAt: submittedAt ? new Date(submittedAt) : new Date()
      },
      include: {
        form: {
          select: { 
            formName: true,
            company: {
              select: {
                name: true,
                logoImageUrl: true
              }
            }
          }
        },
        company: {
          select: { 
            name: true,
            logoImageUrl: true
          }
        }
      }
    });

    // Update form submission count
    await prisma.psychosocialHazardForm.update({
      where: { id: formId },
      data: {
        submissionCount: { increment: 1 }
      }
    });

    console.log('✅ Psychosocial hazard submission created successfully:', submission.id);

    res.status(201).json({
      success: true,
      message: 'Psychosocial hazard report submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error creating psychosocial hazard submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process psychosocial hazard submission'
    });
  }
});

// GET /api/psychosocial-hazard/pdf/:submissionId - Generate PDF (PUBLIC ACCESS)
router.get('/pdf/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;

    console.log('📄 Generating PDF for submission:', submissionId);

    // Find the submission with company details
    const submission = await prisma.psychosocialHazardSubmission.findUnique({
      where: { id: submissionId },
      include: {
        form: {
          select: { 
            formName: true 
          }
        },
        company: {
          select: { 
            name: true,
            logoImageUrl: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'The requested submission does not exist'
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="psychosocial-hazard-report-${submissionId}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add company logo if available (you might need to implement logo fetching)
    // if (submission.company.logoImageUrl) {
    //   try {
    //     doc.image(submission.company.logoImageUrl, 50, 45, { width: 100 });
    //   } catch (logoError) {
    //     console.log('Could not add logo to PDF:', logoError.message);
    //   }
    // }

    // Add header
    doc.fontSize(20)
       .text('Psychosocial Hazard Report', 50, 50, { align: 'center' });

    // Add company name
    doc.fontSize(16)
       .text(submission.company.name, 50, 80, { align: 'center' });

    // Add submission date
    const submissionDate = new Date(submission.submittedAt).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.fontSize(12)
       .text(`Date: ${submissionDate}`, 50, 120, { align: 'right' });

    // Add submission ID
    doc.text(`Submission ID: ${submission.id}`, 50, 140, { align: 'right' });

    // Add personal information
    doc.fontSize(14)
       .text('Personal Information', 50, 180);
    
    doc.fontSize(12)
       .text(`Name: ${submission.firstName} ${submission.lastName}`, 50, 200)
       .text(`Submitted: ${submissionDate}`, 50, 220);

    // Add report content
    doc.fontSize(14)
       .text('Report Details', 50, 260);

    // Clean HTML from description (basic cleanup)
    const cleanDescription = submission.description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&')  // Replace &amp; with &
      .replace(/&lt;/g, '<')   // Replace &lt; with <
      .replace(/&gt;/g, '>')   // Replace &gt; with >
      .trim();

    doc.fontSize(11)
       .text(cleanDescription, 50, 280, {
         width: 500,
         align: 'left'
       });

    // Add footer
    const pageHeight = doc.page.height;
    doc.fontSize(10)
       .text('This document is confidential and should be handled according to company policy.', 
             50, pageHeight - 100, { align: 'center' });

    // Finalize PDF
    doc.end();

    console.log('✅ PDF generated successfully for submission:', submissionId);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate PDF'
    });
  }
});

// PROTECTED ROUTES (require authentication)
router.use(authMiddleware);

// GET /api/psychosocial-hazard - Get all submissions for the company
router.get('/', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      companyId,
      ...(startDate && endDate && {
        submittedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.psychosocialHazardSubmission.findMany({
        where,
        include: {
          form: {
            select: { formName: true }
          },
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.psychosocialHazardSubmission.count({ where })
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
    console.error('Error fetching psychosocial hazard submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// GET /api/psychosocial-hazard/submission/:id - Get specific submission
router.get('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const submission = await prisma.psychosocialHazardSubmission.findFirst({
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
        message: 'Psychosocial hazard submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching psychosocial hazard submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
});

// PUT /api/psychosocial-hazard/submission/:id - Update submission
router.put('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const { firstName, lastName, description } = req.body;

    // Find existing submission
    const existingSubmission = await prisma.psychosocialHazardSubmission.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingSubmission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Psychosocial hazard submission not found'
      });
    }

    // Update submission
    const updatedSubmission = await prisma.psychosocialHazardSubmission.update({
      where: { id },
      data: {
        firstName: firstName || existingSubmission.firstName,
        lastName: lastName || existingSubmission.lastName,
        description: description || existingSubmission.description
      },
      include: {
        form: {
          select: { formName: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Successfully updated psychosocial hazard submission',
      data: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating psychosocial hazard submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update submission'
    });
  }
});

// GET /api/psychosocial-hazard/stats/dashboard - Get statistics
router.get('/stats/dashboard', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalToday,
      totalThisWeek,
      totalThisMonth,
      totalAll
    ] = await Promise.all([
      // Total submissions today
      prisma.psychosocialHazardSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: today }
        }
      }),
      // Total this week
      prisma.psychosocialHazardSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // Total this month
      prisma.psychosocialHazardSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
        }
      }),
      // Total all time
      prisma.psychosocialHazardSubmission.count({
        where: { companyId }
      })
    ]);

    res.json({
      success: true,
      data: {
        today: totalToday,
        thisWeek: totalThisWeek,
        thisMonth: totalThisMonth,
        total: totalAll
      }
    });

  } catch (error) {
    console.error('Error fetching psychosocial hazard stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;