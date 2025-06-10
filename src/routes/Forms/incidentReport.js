// routes/incidentReport.js
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

// GET /api/incident-report/form/:formId - Get form details by form ID (PUBLIC ACCESS)
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    console.log('🔍 Looking for incident report form with ID:', formId);

    // Find the form and get company details
    const form = await prisma.incidentReportForm.findUnique({
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
        message: 'The requested incident report form does not exist'
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
    console.error('Error fetching incident report form details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch form details'
    });
  }
});

// POST /api/incident-report/:formId - Create new submission (PUBLIC ACCESS with optional auth)
router.post('/:formId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { formId } = req.params;
    const {
      // Step 1: Injured Person Details
      firstName,
      lastName,
      dob,
      streetAddress,
      suburb,
      state,
      postCode,
      mobile,
      businessName,
      statusOfInjuredParty,
      
      // Step 2: Incident Details
      incidentDate,
      incidentTime,
      incidentTimeAmPm,
      incidentLocation,
      ceasedWork,
      
      // Injury Details
      injurySustained,
      injuryType,
      bodyPartInjured,
      causeOfInjury,
      treatmentByFirstAid,
      treatmentGiven,
      witnessName,
      witnessContact,
      
      // Step 3: Treatment Details
      medicalCentreAttended,
      medicalCenterName,
      dateAttended,
      medicalCertificate,
      treatment,
      referralIssued,
      injuryManagement,
      
      // Person completing form
      reporterFirstName,
      reporterLastName,
      signature,
      date,
      
      submittedAt
    } = req.body;

    console.log('📝 Creating incident report submission for form:', formId);
    console.log('👤 User authenticated:', !!req.user);

    // Validation
    if (!firstName || !lastName || !dob || !streetAddress || !mobile || !businessName || !statusOfInjuredParty ||
        !incidentDate || !incidentTime || !incidentLocation || !ceasedWork || !injurySustained ||
        !reporterFirstName || !reporterLastName || !date) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please fill in all required fields'
      });
    }

    // Find the form and get the company ID from it
    const form = await prisma.incidentReportForm.findUnique({
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
        message: 'Incident report form not found'
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

    // Map enum values
    const statusMap = {
      'Worker': 'WORKER',
      'Subcontractor': 'SUBCONTRACTOR',
      'Visitor': 'VISITOR',
      'Other': 'OTHER'
    };

    const yesNoMap = {
      'Yes': 'YES',
      'No': 'NO'
    };

    // Create submission
    const submission = await prisma.incidentReportSubmission.create({
      data: {
        companyId,
        formId,
        userId, // Can be null for anonymous submissions
        
        // Step 1: Injured Person Details
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: new Date(dob),
        streetAddress: streetAddress.trim(),
        suburb: suburb?.trim() || null,
        state: state?.trim() || null,
        postCode: postCode?.trim() || null,
        mobile: mobile.trim(),
        businessName: businessName.trim(),
        statusOfInjuredParty: statusMap[statusOfInjuredParty] || 'OTHER',
        
        // Step 2: Incident Details
        incidentDate: new Date(incidentDate),
        incidentTime: incidentTime.trim(),
        incidentTimeAmPm: incidentTimeAmPm || 'AM',
        incidentLocation: incidentLocation.trim(),
        ceasedWork: yesNoMap[ceasedWork] || 'NO',
        
        // Injury Details
        injurySustained: yesNoMap[injurySustained] || 'NO',
        injuryType: injuryType?.trim() || null,
        bodyPartInjured: bodyPartInjured?.trim() || null,
        causeOfInjury: causeOfInjury?.trim() || null,
        treatmentByFirstAid: treatmentByFirstAid ? yesNoMap[treatmentByFirstAid] : null,
        treatmentGiven: treatmentGiven ? yesNoMap[treatmentGiven] : null,
        witnessName: witnessName?.trim() || null,
        witnessContact: witnessContact?.trim() || null,
        
        // Step 3: Treatment Details
        medicalCentreAttended: medicalCentreAttended ? yesNoMap[medicalCentreAttended] : null,
        medicalCenterName: medicalCenterName?.trim() || null,
        dateAttended: dateAttended ? new Date(dateAttended) : null,
        medicalCertificate: medicalCertificate ? yesNoMap[medicalCertificate] : null,
        treatment: treatment?.trim() || null,
        referralIssued: referralIssued ? yesNoMap[referralIssued] : null,
        injuryManagement: injuryManagement ? yesNoMap[injuryManagement] : null,
        
        // Person completing form
        reporterFirstName: reporterFirstName.trim(),
        reporterLastName: reporterLastName.trim(),
        signature,
        date: new Date(date),
        
        status: 'PENDING',
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
    await prisma.incidentReportForm.update({
      where: { id: formId },
      data: {
        submissionCount: { increment: 1 }
      }
    });

    console.log('✅ Incident report submission created successfully:', submission.id);

    res.status(201).json({
      success: true,
      message: 'Incident and injury report submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error creating incident report submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process incident report submission'
    });
  }
});

// PROTECTED ROUTES (require authentication)
router.use(authMiddleware);

// GET /api/incident-report - Get all submissions for the company
router.get('/', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      status,
      startDate, 
      endDate 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      companyId,
      ...(status && { status }),
      ...(startDate && endDate && {
        submittedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.incidentReportSubmission.findMany({
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
      prisma.incidentReportSubmission.count({ where })
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
    console.error('Error fetching incident report submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// GET /api/incident-report/submission/:id - Get specific submission
router.get('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const submission = await prisma.incidentReportSubmission.findFirst({
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
        message: 'Incident report submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching incident report submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
});

// PUT /api/incident-report/submission/:id - Update submission
router.put('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const updateData = req.body;

    // Find existing submission
    const existingSubmission = await prisma.incidentReportSubmission.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingSubmission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Incident report submission not found'
      });
    }

    // Update submission
    const updatedSubmission = await prisma.incidentReportSubmission.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        form: {
          select: { formName: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Successfully updated incident report submission',
      data: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating incident report submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update submission'
    });
  }
});

// GET /api/incident-report/stats/dashboard - Get statistics
router.get('/stats/dashboard', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalToday,
      totalThisWeek,
      totalThisMonth,
      totalPending,
      totalUnderInvestigation,
      totalCompleted,
      totalAll
    ] = await Promise.all([
      // Total submissions today
      prisma.incidentReportSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: today }
        }
      }),
      // Total this week
      prisma.incidentReportSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // Total this month
      prisma.incidentReportSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
        }
      }),
      // Total pending
      prisma.incidentReportSubmission.count({
        where: {
          companyId,
          status: 'PENDING'
        }
      }),
      // Total under investigation
      prisma.incidentReportSubmission.count({
        where: {
          companyId,
          status: 'UNDER_INVESTIGATION'
        }
      }),
      // Total completed
      prisma.incidentReportSubmission.count({
        where: {
          companyId,
          status: 'COMPLETED'
        }
      }),
      // Total all time
      prisma.incidentReportSubmission.count({
        where: { companyId }
      })
    ]);

    res.json({
      success: true,
      data: {
        today: totalToday,
        thisWeek: totalThisWeek,
        thisMonth: totalThisMonth,
        pending: totalPending,
        underInvestigation: totalUnderInvestigation,
        completed: totalCompleted,
        total: totalAll
      }
    });

  } catch (error) {
    console.error('Error fetching incident report stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;