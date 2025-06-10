// routes/swmsInspection.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { uploadMultipleToCloudinary, upload, handleMulterError } = require('../../middleware/upload');

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

// GET /api/swms-inspection/form/:formId - Get form details by form ID (PUBLIC ACCESS)
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    console.log('🔍 Looking for SWMS inspection form with ID:', formId);

    // Find the form and get company details
    const form = await prisma.swmsInspectionForm.findUnique({
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
        message: 'The requested SWMS inspection form does not exist'
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
    console.error('Error fetching SWMS inspection form details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch form details'
    });
  }
});

// POST /api/swms-inspection/upload-images - Handle multiple image upload
router.post('/upload-images', upload.array('images', 10), handleMulterError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log(`📸 Uploading ${req.files.length} images to Cloudinary...`);

    // Upload multiple images to Cloudinary
    const uploadedImages = await uploadMultipleToCloudinary(req.files, 'swms-inspections');

    console.log('✅ Images uploaded successfully:', uploadedImages.length);

    res.json({
      success: true,
      data: uploadedImages,
      message: `${uploadedImages.length} images uploaded successfully`
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
});

// POST /api/swms-inspection/:formId - Create new submission (PUBLIC ACCESS with optional auth)
router.post('/:formId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { formId } = req.params;
    const {
      companyName,
      workerName,
      worksUndertaken,
      personCompletingInspection,
      inductionCompleted,
      whiteCardRequired,
      adequateSupervision,
      requiredCompetencies,
      additionalChecks,
      uploadedImages,
      issuesIdentified,
      actionRequired,
      signature,
      submittedAt
    } = req.body;

    console.log('📝 Creating SWMS inspection submission for form:', formId);
    console.log('👤 User authenticated:', !!req.user);

    // Validation
    if (!companyName || !workerName || !worksUndertaken || !personCompletingInspection) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Company name, worker name, works undertaken, and person completing inspection are required'
      });
    }

    // Validate enum values
    const validAnswers = ['YES', 'NO', 'NA'];
    const validActionTimeframes = ['WITHIN_1_DAY', 'WITHIN_7_DAYS', 'WITHIN_14_DAYS', 'NO_ACTION_REQUIRED'];

    if (!validAnswers.includes(inductionCompleted) ||
        !validAnswers.includes(whiteCardRequired) ||
        !validAnswers.includes(adequateSupervision) ||
        !validAnswers.includes(requiredCompetencies) ||
        !validAnswers.includes(additionalChecks)) {
      return res.status(400).json({
        error: 'Invalid field values',
        message: 'All inspection answers must be YES, NO, or NA'
      });
    }

    // Validate uploaded images format
    if (uploadedImages && !Array.isArray(uploadedImages)) {
      return res.status(400).json({
        error: 'Invalid images format',
        message: 'Uploaded images must be an array'
      });
    }

    // Validate each image object structure
    if (uploadedImages && uploadedImages.length > 0) {
      const isValidImageFormat = uploadedImages.every(img => 
        img && 
        typeof img.url === 'string' && 
        typeof img.publicId === 'string'
      );
      
      if (!isValidImageFormat) {
        return res.status(400).json({
          error: 'Invalid image format',
          message: 'Each image must have url and publicId'
        });
      }
    }

    // Find the form and get the company ID from it
    const form = await prisma.swmsInspectionForm.findUnique({
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
        message: 'SWMS inspection form not found'
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
    const submission = await prisma.swmsInspectionSubmission.create({
      data: {
        companyId,
        formId,
        userId, // Can be null for anonymous submissions
        companyName,
        workerName,
        worksUndertaken,
        personCompletingInspection,
        inductionCompleted,
        whiteCardRequired,
        adequateSupervision,
        requiredCompetencies,
        additionalChecks,
        uploadedImages: uploadedImages || [],
        issuesIdentified,
        actionRequired,
        signature,
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
    await prisma.swmsInspectionForm.update({
      where: { id: formId },
      data: {
        submissionCount: { increment: 1 }
      }
    });

    console.log('✅ SWMS inspection submission created successfully:', submission.id);

    res.status(201).json({
      success: true,
      message: 'SWMS inspection submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error creating SWMS inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process SWMS inspection submission'
    });
  }
});

// POST /api/swms-inspection/upload-images - Handle multiple image upload
router.post('/upload-images', upload.array('images', 10), handleMulterError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log(`📸 Uploading ${req.files.length} images to Cloudinary...`);

    // Upload multiple images to Cloudinary
    const uploadedImages = await uploadMultipleToCloudinary(req.files, 'swms-inspections');

    console.log('✅ Images uploaded successfully:', uploadedImages.length);

    res.json({
      success: true,
      data: uploadedImages,
      message: `${uploadedImages.length} images uploaded successfully`
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
});

// PROTECTED ROUTES (require authentication)
router.use(authMiddleware);

// GET /api/swms-inspection - Get all submissions for the company
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
      prisma.swmsInspectionSubmission.findMany({
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
      prisma.swmsInspectionSubmission.count({ where })
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
    console.error('Error fetching SWMS inspection submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// GET /api/swms-inspection/submission/:id - Get specific submission
router.get('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const submission = await prisma.swmsInspectionSubmission.findFirst({
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
        message: 'SWMS inspection submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching SWMS inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
});

// PUT /api/swms-inspection/submission/:id - Update submission
router.put('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const updateData = req.body;

    // Find existing submission
    const existingSubmission = await prisma.swmsInspectionSubmission.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingSubmission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'SWMS inspection submission not found'
      });
    }

    // Update submission
    const updatedSubmission = await prisma.swmsInspectionSubmission.update({
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
      message: 'Successfully updated SWMS inspection submission',
      data: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating SWMS inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update submission'
    });
  }
});

// GET /api/swms-inspection/stats/dashboard - Get statistics
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
      pendingReview,
      completedInspections
    ] = await Promise.all([
      // Total submissions today
      prisma.swmsInspectionSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: today }
        }
      }),
      // Total this week
      prisma.swmsInspectionSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // Total this month
      prisma.swmsInspectionSubmission.count({
        where: {
          companyId,
          submittedAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
        }
      }),
      // Total all time
      prisma.swmsInspectionSubmission.count({
        where: { companyId }
      }),
      // Pending review
      prisma.swmsInspectionSubmission.count({
        where: {
          companyId,
          status: 'PENDING'
        }
      }),
      // Completed inspections
      prisma.swmsInspectionSubmission.count({
        where: {
          companyId,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        today: totalToday,
        thisWeek: totalThisWeek,
        thisMonth: totalThisMonth,
        total: totalAll,
        pendingReview: pendingReview,
        completed: completedInspections
      }
    });

  } catch (error) {
    console.error('Error fetching SWMS inspection stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics'
    });
  }
});

// POST /api/swms-inspection/upload-image - Handle image upload for inspection
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'swms-inspections',
      public_id: `swms_inspection_${Date.now()}`,
      transformation: [
        { width: 1024, height: 1024, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    });

    res.json({
      success: true,
      data: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        original_filename: req.file.originalname
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

// POST /api/swms-inspection/upload-image - Handle image upload for inspection
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'swms-inspections',
      public_id: `swms_inspection_${Date.now()}`,
      transformation: [
        { width: 1024, height: 1024, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    });

    res.json({
      success: true,
      data: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        original_filename: req.file.originalname
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

module.exports = router;