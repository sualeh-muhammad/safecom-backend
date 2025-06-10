// routes/vehicleInspection.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { upload, uploadToCloudinary } = require('../../middleware/upload');

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

// GET /api/vehicle-inspection/form/:formId - Get form details by form ID (PUBLIC ACCESS)
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    console.log('🔍 Looking for vehicle inspection form with ID:', formId);

    // Find the form and get company details
    const form = await prisma.vehicleInspectionForm.findUnique({
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
        message: 'The requested vehicle inspection form does not exist'
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
    console.error('Error fetching vehicle inspection form details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch form details'
    });
  }
});

// POST /api/vehicle-inspection/:formId - Create new submission (PUBLIC ACCESS with optional auth)
router.post('/:formId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { formId } = req.params;
    const {
      date,
      vehicleType,
      licensePlate,
      mileage,
      vehiclePhotoData,
      engineOil,
      coolantLevel,
      brakeFluidLevel,
      steeringFluidLevel,
      washerFluidLevel,
      washerAndWipers,
      tyreTreadAndSidewalls,
      wheelNutsSecure,
      batteryCondition,
      bodyworkGlassMirrors,
      fireExtinguisher,
      cleanAndTidy,
      anyDefects,
      signatureData,
      submittedAt
    } = req.body;

    console.log('📝 Creating vehicle inspection submission for form:', formId);
    console.log('👤 User authenticated:', !!req.user);

    // Validation
    if (!vehicleType || !licensePlate || !mileage) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Vehicle type, license plate, and mileage are required'
      });
    }

    // Find the form and get the company ID from it
    const form = await prisma.vehicleInspectionForm.findUnique({
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
        message: 'Vehicle inspection form not found'
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
      console.log('👤 Creating public submission');
    }

    // Determine inspection status based on check results
    const checkResults = [
      engineOil, coolantLevel, brakeFluidLevel, steeringFluidLevel, washerFluidLevel,
      washerAndWipers, tyreTreadAndSidewalls, wheelNutsSecure, batteryCondition, 
      bodyworkGlassMirrors, fireExtinguisher, cleanAndTidy
    ];
    
    const hasFailures = checkResults.includes('FAIL');
    const status = hasFailures ? 'FLAGGED' : 'COMPLETED';

    // Create submission
    const submission = await prisma.vehicleInspectionSubmission.create({
      data: {
        companyId,
        formId,
        userId, // Can be null for public submissions
        date: date ? new Date(date) : new Date(),
        vehicleType,
        licensePlate,
        mileage: parseFloat(mileage),
        vehiclePhotoData, // Store base64 temporarily
        engineOil,
        coolantLevel,
        brakeFluidLevel,
        steeringFluidLevel,
        washerFluidLevel,
        washerAndWipers,
        tyreTreadAndSidewalls,
        wheelNutsSecure,
        batteryCondition,
        bodyworkGlassMirrors,
        fireExtinguisher,
        cleanAndTidy,
        anyDefects: anyDefects || 'No defects reported',
        signatureData, // Store base64 temporarily
        status,
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
    await prisma.vehicleInspectionForm.update({
      where: { id: formId },
      data: {
        submissionCount: { increment: 1 }
      }
    });

    console.log('✅ Vehicle inspection submission created successfully:', submission.id);

    res.status(201).json({
      success: true,
      message: 'Vehicle inspection submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error creating vehicle inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process vehicle inspection submission'
    });
  }
});

// POST /api/vehicle-inspection/upload/:submissionId - Upload images to Cloudinary
router.post('/upload/:submissionId', authMiddleware, upload.fields([
  { name: 'vehiclePhoto', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { companyId } = req.user;

    console.log('📤 Uploading images for submission:', submissionId);

    // Find the submission
    const submission = await prisma.vehicleInspectionSubmission.findFirst({
      where: {
        id: submissionId,
        companyId
      }
    });

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Vehicle inspection submission not found'
      });
    }

    const updateData = {};

    // Upload vehicle photo if provided
    if (req.files.vehiclePhoto && req.files.vehiclePhoto[0]) {
      const vehiclePhotoResult = await uploadToCloudinary(req.files.vehiclePhoto[0].buffer, {
        folder: 'vehicle-inspections/photos',
        public_id: `vehicle_${submissionId}_photo_${Date.now()}`,
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      });
      updateData.vehiclePhotoUrl = vehiclePhotoResult.secure_url;
    }

    // Upload signature if provided
    if (req.files.signature && req.files.signature[0]) {
      const signatureResult = await uploadToCloudinary(req.files.signature[0].buffer, {
        folder: 'vehicle-inspections/signatures',
        public_id: `vehicle_${submissionId}_signature_${Date.now()}`,
        transformation: [
          { width: 600, height: 200, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      });
      updateData.signatureUrl = signatureResult.secure_url;
    }

    // Update submission with URLs
    if (Object.keys(updateData).length > 0) {
      await prisma.vehicleInspectionSubmission.update({
        where: { id: submissionId },
        data: updateData
      });
    }

    console.log('✅ Images uploaded successfully');

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: updateData
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to upload images'
    });
  }
});

// PROTECTED ROUTES (require authentication)
router.use(authMiddleware);

// GET /api/vehicle-inspection - Get all submissions for the company
router.get('/', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      jobSiteId, 
      startDate, 
      endDate,
      vehicleType
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      companyId,
      ...(status && { status }),
      ...(jobSiteId && { jobSiteId }),
      ...(vehicleType && { vehicleType: { contains: vehicleType, mode: 'insensitive' } }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.vehicleInspectionSubmission.findMany({
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
      prisma.vehicleInspectionSubmission.count({ where })
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
    console.error('Error fetching vehicle inspection submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// GET /api/vehicle-inspection/submission/:id - Get specific submission
router.get('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const submission = await prisma.vehicleInspectionSubmission.findFirst({
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
        message: 'Vehicle inspection submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching vehicle inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
});

// PUT /api/vehicle-inspection/submission/:id - Update submission
router.put('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const updateData = req.body;

    // Find existing submission
    const existingSubmission = await prisma.vehicleInspectionSubmission.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingSubmission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Vehicle inspection submission not found'
      });
    }

    // Update submission
    const updatedSubmission = await prisma.vehicleInspectionSubmission.update({
      where: { id },
      data: updateData,
      include: {
        form: {
          select: { formName: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Successfully updated vehicle inspection submission',
      data: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating vehicle inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update submission'
    });
  }
});

// GET /api/vehicle-inspection/stats/dashboard - Get statistics
router.get('/stats/dashboard', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalToday,
      totalThisWeek,
      totalThisMonth,
      totalAll,
      flaggedInspections,
      passedInspections,
      failedInspections
    ] = await Promise.all([
      // Total inspections today
      prisma.vehicleInspectionSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: today }
        }
      }),
      // Total this week
      prisma.vehicleInspectionSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // Total this month
      prisma.vehicleInspectionSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
        }
      }),
      // Total all time
      prisma.vehicleInspectionSubmission.count({
        where: { companyId }
      }),
      // Flagged inspections (with failures)
      prisma.vehicleInspectionSubmission.count({
        where: {
          companyId,
          status: 'FLAGGED'
        }
      }),
      // All passed inspections
      prisma.vehicleInspectionSubmission.count({
        where: {
          companyId,
          status: 'COMPLETED'
        }
      }),
      // Count submissions with any failed checks
      prisma.vehicleInspectionSubmission.count({
        where: {
          companyId,
          OR: [
            { engineOil: 'FAIL' },
            { coolantLevel: 'FAIL' },
            { brakeFluidLevel: 'FAIL' },
            { steeringFluidLevel: 'FAIL' },
            { washerFluidLevel: 'FAIL' },
            { washerAndWipers: 'FAIL' },
            { tyreTreadAndSidewalls: 'FAIL' },
            { wheelNutsSecure: 'FAIL' },
            { batteryCondition: 'FAIL' },
            { bodyworkGlassMirrors: 'FAIL' },
            { fireExtinguisher: 'FAIL' },
            { cleanAndTidy: 'FAIL' }
          ]
        }
      })
    ]);

    // Get recent submissions for activity feed
    const recentSubmissions = await prisma.vehicleInspectionSubmission.findMany({
      where: { companyId },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Get vehicle types breakdown
    const vehicleTypesBreakdown = await prisma.vehicleInspectionSubmission.groupBy({
      by: ['vehicleType'],
      where: { companyId },
      _count: {
        vehicleType: true
      },
      orderBy: {
        _count: {
          vehicleType: 'desc'
        }
      },
      take: 10
    });

    res.json({
      success: true,
      data: {
        summary: {
          today: totalToday,
          thisWeek: totalThisWeek,
          thisMonth: totalThisMonth,
          total: totalAll
        },
        inspectionResults: {
          passed: passedInspections,
          flagged: flaggedInspections,
          withFailures: failedInspections
        },
        recentActivity: recentSubmissions.map(submission => ({
          id: submission.id,
          vehicleType: submission.vehicleType,
          licensePlate: submission.licensePlate,
          status: submission.status,
          inspector: submission.user ? 
            `${submission.user.firstName} ${submission.user.lastName}` : 
            'Anonymous',
          submittedAt: submission.submittedAt
        })),
        vehicleTypes: vehicleTypesBreakdown.map(item => ({
          type: item.vehicleType,
          count: item._count.vehicleType
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching vehicle inspection stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics'
    });
  }
});

// GET /api/vehicle-inspection/export - Export submissions to CSV
router.get('/export', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const { startDate, endDate, status, vehicleType } = req.query;

    // Build where clause
    const where = {
      companyId,
      ...(status && { status }),
      ...(vehicleType && { vehicleType: { contains: vehicleType, mode: 'insensitive' } }),
      ...(startDate && endDate && {
        submittedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const submissions = await prisma.vehicleInspectionSubmission.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        form: {
          select: { formName: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Convert to CSV format
    const csvHeaders = [
      'Submission ID',
      'Date',
      'Vehicle Type',
      'License Plate',
      'Mileage',
      'Inspector',
      'Status',
      'Engine Oil',
      'Coolant Level',
      'Brake Fluid',
      'Steering Fluid',
      'Washer Fluid',
      'Washer & Wipers',
      'Tyre Condition',
      'Wheel Nuts',
      'Battery',
      'Bodywork',
      'Fire Extinguisher',
      'Clean & Tidy',
      'Defects',
      'Submitted At'
    ];

    const csvRows = submissions.map(submission => [
      submission.id,
      submission.date.toISOString().split('T')[0],
      submission.vehicleType,
      submission.licensePlate,
      submission.mileage,
      submission.user ? 
        `${submission.user.firstName} ${submission.user.lastName}` : 
        'Anonymous',
      submission.status,
      submission.engineOil,
      submission.coolantLevel,
      submission.brakeFluidLevel,
      submission.steeringFluidLevel,
      submission.washerFluidLevel,
      submission.washerAndWipers,
      submission.tyreTreadAndSidewalls,
      submission.wheelNutsSecure,
      submission.batteryCondition,
      submission.bodyworkGlassMirrors,
      submission.fireExtinguisher,
      submission.cleanAndTidy,
      submission.anyDefects.replace(/,/g, ';'), // Replace commas to avoid CSV issues
      submission.submittedAt.toISOString()
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vehicle-inspections.csv"');
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting vehicle inspection data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to export data'
    });
  }
});

module.exports = router;