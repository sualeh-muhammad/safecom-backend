// routes/forms/preStartStaff.js
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

// GET /api/pre-start-staff/form/:formId - Get form details by form ID (PUBLIC ACCESS)
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    console.log('🔍 Looking for pre start staff form with ID:', formId);

    // Find the form and get company details
    const form = await prisma.preStartStaffForm.findUnique({
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
        message: 'The requested pre start staff form does not exist'
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
    console.error('Error fetching pre start staff form details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch form details'
    });
  }
});

// POST /api/pre-start-staff/:formId - Create new submission (PUBLIC ACCESS with optional auth)
router.post('/:formId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { formId } = req.params;
    const {
      projectName,
      date,
      time,
      timePeriod,
      briefingBy,
      locationOfWorks,
      supervisorForeman,
      workActivities,
      otherActivities,
      safetyChecklist,
      environmentalChecklist,
      riskManagementChecklist,
      riskManagementDescription,
      riskManagementNotes,
      additionalNotes,
      actionedBy,
      submittedAt
    } = req.body;

    console.log('📝 Creating pre start staff submission for form:', formId);
    console.log('👤 User authenticated:', !!req.user);

    // Basic validation
    if (!projectName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Project name is required'
      });
    }

    // Find the form and get the company ID from it
    const form = await prisma.preStartStaffForm.findUnique({
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
        message: 'Pre start staff form not found'
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

    // Validate and find the jobsite if projectName is provided
    let jobSiteId = null;
    if (projectName) {
      const jobSite = await prisma.jobSite.findFirst({
        where: {
          id: projectName, // Assuming projectName contains the jobsite ID
          companyId: companyId
        }
      });

      if (jobSite) {
        jobSiteId = jobSite.id;
        console.log('🏗️ Found matching jobsite:', jobSite.jobsiteName);
      } else {
        console.log('⚠️ No matching jobsite found for:', projectName);
      }
    }

    // Create submission
    const submission = await prisma.preStartStaffSubmission.create({
      data: {
        companyId,
        formId,
        userId, // Can be null for anonymous submissions
        jobSiteId,
        projectName: projectName || '',
        date: date ? new Date(date) : new Date(),
        time: time || '',
        timePeriod: timePeriod || 'AM',
        briefingBy: briefingBy || '',
        locationOfWorks: locationOfWorks || '',
        supervisorForeman: supervisorForeman || '',
        workActivities: workActivities || [],
        otherActivities: otherActivities || [],
        safetyChecklist: safetyChecklist || {},
        environmentalChecklist: environmentalChecklist || {},
        riskManagementChecklist: riskManagementChecklist || {},
        riskManagementDescription: riskManagementDescription || '',
        riskManagementNotes: riskManagementNotes || [],
        additionalNotes: additionalNotes || [],
        actionedBy: actionedBy || '',
        submittedAt: submittedAt ? new Date(submittedAt) : new Date()
      }
    });

    // Fetch the submission with includes separately to avoid relation conflicts
    const submissionWithIncludes = await prisma.preStartStaffSubmission.findUnique({
      where: { id: submission.id },
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
        // Temporarily remove jobSite include until schema is fixed
        // jobSite: {
        //   select: {
        //     jobsiteName: true
        //   }
        // }
      }
    });

    // Update form submission count
    await prisma.preStartStaffForm.update({
      where: { id: formId },
      data: {
        submissionCount: { increment: 1 }
      }
    });

    console.log('✅ Pre start staff submission created successfully:', submission.id);

    res.status(201).json({
      success: true,
      message: 'Pre start staff form submitted successfully',
      data: submissionWithIncludes
    });

  } catch (error) {
    console.error('Error creating pre start staff submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process pre start staff submission'
    });
  }
});

// GET /api/pre-start-staff/pdf/:submissionId - Generate PDF (requires auth)
router.get('/pdf/:submissionId', authMiddleware, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { companyId } = req.user;

    console.log('📄 Generating PDF for submission:', submissionId);

    // Find the submission with company details
    const submission = await prisma.preStartStaffSubmission.findFirst({
      where: { 
        id: submissionId,
        companyId // Ensure user can only access their company's submissions
      },
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
        },
        jobSite: {
          select: {
            jobsiteName: true
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
    res.setHeader('Content-Disposition', `attachment; filename="pre-start-staff-${submissionId}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20)
       .text(`Pre Start ${submission.company.name} Staff`, 50, 50, { align: 'center' });

    // Add submission date
    const submissionDate = new Date(submission.submittedAt).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.fontSize(12)
       .text(`Date: ${submissionDate}`, 50, 80, { align: 'right' });

    // Add submission ID
    doc.text(`Submission ID: ${submission.id}`, 50, 100, { align: 'right' });

    // Add basic information
    doc.fontSize(14)
       .text('Basic Information', 50, 140);
    
    let yPosition = 160;
    
    doc.fontSize(11)
       .text(`Project: ${submission.jobSite?.jobsiteName || submission.projectName}`, 50, yPosition)
       .text(`Date: ${new Date(submission.date).toLocaleDateString()}`, 50, yPosition + 20)
       .text(`Time: ${submission.time} ${submission.timePeriod}`, 50, yPosition + 40)
       .text(`Briefing By: ${submission.briefingBy}`, 50, yPosition + 60)
       .text(`Location of Works: ${submission.locationOfWorks}`, 50, yPosition + 80)
       .text(`Supervisor/Foreman: ${submission.supervisorForeman}`, 50, yPosition + 100);

    yPosition += 140;

    // Add work activities if any
    if (submission.workActivities && submission.workActivities.length > 0) {
      doc.fontSize(14)
         .text('Work Activities', 50, yPosition);
      
      yPosition += 20;
      
      submission.workActivities.forEach((activity, index) => {
        if (activity.jobActivity || activity.location || activity.notes) {
          doc.fontSize(11)
             .text(`${index + 1}. Activity: ${activity.jobActivity}`, 50, yPosition)
             .text(`   Location: ${activity.location}`, 50, yPosition + 15)
             .text(`   Notes: ${activity.notes}`, 50, yPosition + 30);
          yPosition += 50;
        }
      });
    }

    // Add safety checklist summary
    if (submission.safetyChecklist && Object.keys(submission.safetyChecklist).length > 0) {
      doc.fontSize(14)
         .text('Safety Checklist', 50, yPosition);
      
      yPosition += 20;
      
      const checkedItems = Object.entries(submission.safetyChecklist)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
      
      if (checkedItems.length > 0) {
        doc.fontSize(11)
           .text(`Checked items: ${checkedItems.join(', ')}`, 50, yPosition, {
             width: 500,
             align: 'left'
           });
        yPosition += 40;
      }
    }

    // Add additional notes
    if (submission.additionalNotes && submission.additionalNotes.length > 0) {
      doc.fontSize(14)
         .text('Additional Notes', 50, yPosition);
      
      yPosition += 20;
      
      submission.additionalNotes.forEach((note, index) => {
        if (note) {
          doc.fontSize(11)
             .text(`${index + 1}. ${note}`, 50, yPosition);
          yPosition += 20;
        }
      });
    }

    // Add actioned by
    if (submission.actionedBy) {
      yPosition += 20;
      doc.fontSize(11)
         .text(`Actioned By: ${submission.actionedBy}`, 50, yPosition);
    }

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

// GET /api/pre-start-staff - Get all submissions for the company
router.get('/', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate,
      jobSiteId
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      companyId,
      ...(jobSiteId && { jobSiteId }),
      ...(startDate && endDate && {
        submittedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.preStartStaffSubmission.findMany({
        where,
        include: {
          form: {
            select: { formName: true }
          },
          user: {
            select: { firstName: true, lastName: true, email: true }
          },
          jobSite: {
            select: { jobsiteName: true }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.preStartStaffSubmission.count({ where })
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
    console.error('Error fetching pre start staff submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// GET /api/pre-start-staff/submission/:id - Get specific submission
router.get('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const submission = await prisma.preStartStaffSubmission.findFirst({
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
        },
        jobSite: {
          select: { jobsiteName: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Pre start staff submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching pre start staff submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
});

// PUT /api/pre-start-staff/submission/:id - Update submission
router.put('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const updateData = req.body;

    // Find existing submission
    const existingSubmission = await prisma.preStartStaffSubmission.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingSubmission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Pre start staff submission not found'
      });
    }

    // Update submission
    const updatedSubmission = await prisma.preStartStaffSubmission.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        form: {
          select: { formName: true }
        },
        jobSite: {
          select: { jobsiteName: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Successfully updated pre start staff submission',
      data: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating pre start staff submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update submission'
    });
  }
});

// GET /api/pre-start-staff/stats/dashboard - Get statistics
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
      prisma.preStartStaffSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: today }
        }
      }),
      // Total this week
      prisma.preStartStaffSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // Total this month
      prisma.preStartStaffSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
        }
      }),
      // Total all time
      prisma.preStartStaffSubmission.count({
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
    console.error('Error fetching pre start staff stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics'
    });
  }
});

// DELETE /api/pre-start-staff/submission/:id - Delete submission
router.delete('/submission/:id', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    // Find existing submission
    const existingSubmission = await prisma.preStartStaffSubmission.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingSubmission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Pre start staff submission not found'
      });
    }

    // Delete submission
    await prisma.preStartStaffSubmission.delete({
      where: { id }
    });

    // Update form submission count
    await prisma.preStartStaffForm.update({
      where: { id: existingSubmission.formId },
      data: {
        submissionCount: { decrement: 1 }
      }
    });

    res.json({
      success: true,
      message: 'Pre start staff submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting pre start staff submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete submission'
    });
  }
});

module.exports = router;