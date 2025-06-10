const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { uploadToCloudinary, upload } = require('../../middleware/upload');
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

// Helper function to map EWP type string to enum value
const mapEwpTypeToEnum = (ewpType) => {
  const typeMap = {
    'Truck Mounted EWP (Knuckle Boom)': 'TRUCK_MOUNTED_KNUCKLE_BOOM',
    'Scissor Lift': 'SCISSOR_LIFT',
    'Boom Lift': 'BOOM_LIFT',
    'One Person Lift': 'ONE_PERSON_LIFT'
  };
  return typeMap[ewpType] || 'SCISSOR_LIFT';
};

// Helper function to determine overall inspection result
const calculateInspectionResult = (allChecks) => {
  let hasFail = false;
  let hasComment = false;
  
  for (const checkGroup of allChecks) {
    for (const item of checkGroup) {
      if (item.value === 'fail') {
        hasFail = true;
      } else if (item.value === 'comment') {
        hasComment = true;
      }
    }
  }
  
  if (hasFail) {
    return 'FAIL_CRITICAL_ISSUES';
  } else if (hasComment) {
    return 'REQUIRES_REVIEW';
  } else {
    return 'PASS';
  }
};

// PUBLIC ROUTES (no auth required)

// GET /api/ewp-inspection/form/:formId - Get form details by form ID (PUBLIC ACCESS)
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    console.log('🔍 Looking for EWP inspection form with ID:', formId);

    // Find the form and get company details
    const form = await prisma.ewpInspectionForm.findUnique({
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
        message: 'The requested EWP inspection form does not exist'
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
    console.error('Error fetching EWP inspection form details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch form details'
    });
  }
});

// POST /api/ewp-inspection/:formId - Create new submission (PUBLIC ACCESS with optional auth)
router.post('/:formId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { formId } = req.params;
    const {
      inspectorFirstName,
      inspectorLastName,
      inspectionDate,
      ewpType,
      assetNumber,
      paperworkChecks,
      generalMaintenanceChecks,
      lowerUnitChecks,
      lowerControlsChecks,
      upperControlsChecks,
      workAreaChecks,
      ewpPhoto,
      comments,
      signature
    } = req.body;

    console.log('📝 Creating EWP inspection submission for form:', formId);
    console.log('👤 User authenticated:', !!req.user);

    // Validation
    if (!inspectorFirstName || !inspectorLastName || !ewpType || !assetNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Inspector name, EWP type, and asset number are required'
      });
    }

    // Find the form and get the company ID from it
    const form = await prisma.ewpInspectionForm.findUnique({
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
        message: 'EWP inspection form not found'
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

    // Handle image upload if provided
    let ewpPhotoUrl = null;
    if (ewpPhoto && ewpPhoto.startsWith('data:image/')) {
      try {
        // Convert base64 to buffer
        const base64Data = ewpPhoto.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(imageBuffer, {
          folder: 'ewp-inspections',
          public_id: `ewp_${formId}_${Date.now()}`,
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        });
        
        ewpPhotoUrl = uploadResult.secure_url;
        console.log('📸 Image uploaded to Cloudinary:', ewpPhotoUrl);
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        // Continue without image rather than failing the entire submission
      }
    }

    // Handle signature upload if provided
    let signatureUrl = null;
    if (signature && signature.startsWith('data:image/')) {
      try {
        const base64Data = signature.replace(/^data:image\/\w+;base64,/, '');
        const signatureBuffer = Buffer.from(base64Data, 'base64');
        
        const uploadResult = await uploadToCloudinary(signatureBuffer, {
          folder: 'ewp-signatures',
          public_id: `signature_${formId}_${Date.now()}`,
          transformation: [
            { width: 400, height: 200, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        });
        
        signatureUrl = uploadResult.secure_url;
        console.log('✍️ Signature uploaded to Cloudinary:', signatureUrl);
      } catch (uploadError) {
        console.error('Error uploading signature:', uploadError);
      }
    }

    // Calculate overall inspection result
    const allChecks = [
      paperworkChecks || [],
      generalMaintenanceChecks || [],
      lowerUnitChecks || [],
      lowerControlsChecks || [],
      upperControlsChecks || [],
      workAreaChecks || []
    ];
    
    const overallResult = calculateInspectionResult(allChecks);
    const criticalIssuesFound = allChecks.some(checkGroup => 
      checkGroup.some(item => item.value === 'fail')
    );

    // Create submission
    const submission = await prisma.ewpInspectionSubmission.create({
      data: {
        companyId,
        formId,
        userId, // Can be null for anonymous submissions
        inspectorFirstName,
        inspectorLastName,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : new Date(),
        ewpType: mapEwpTypeToEnum(ewpType),
        assetNumber,
        paperworkChecks: paperworkChecks || [],
        generalMaintenanceChecks: generalMaintenanceChecks || [],
        lowerUnitChecks: lowerUnitChecks || [],
        lowerControlsChecks: lowerControlsChecks || [],
        upperControlsChecks: upperControlsChecks || [],
        workAreaChecks: workAreaChecks || [],
        ewpPhoto: ewpPhoto || null,
        ewpPhotoUrl: ewpPhotoUrl,
        comments: comments || [],
        signature: signature || null,
        signatureUrl: signatureUrl,
        overallResult,
        criticalIssuesFound
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
    await prisma.ewpInspectionForm.update({
      where: { id: formId },
      data: {
        submissionCount: { increment: 1 }
      }
    });

    console.log('✅ EWP inspection submission created successfully:', submission.id);

    res.status(201).json({
      success: true,
      message: 'EWP inspection submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error creating EWP inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process EWP inspection submission'
    });
  }
});

// POST /api/ewp-inspection/upload-image - Upload image to Cloudinary
router.post('/upload-image', optionalAuthMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { type = 'ewp-photo' } = req.body;
    
    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: type === 'signature' ? 'ewp-signatures' : 'ewp-inspections',
      public_id: `${type}_${Date.now()}`,
      transformation: [
        { width: type === 'signature' ? 400 : 800, height: type === 'signature' ? 200 : 600, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    });

    res.json({
      success: true,
      data: {
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

// GET /api/ewp-inspection/pdf/:submissionId - Generate PDF (PUBLIC ACCESS)
router.get('/pdf/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;

    console.log('📄 Generating PDF for EWP inspection submission:', submissionId);

    // Find the submission with company details
    const submission = await prisma.ewpInspectionSubmission.findUnique({
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
    res.setHeader('Content-Disposition', `attachment; filename="ewp-inspection-${submissionId}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20)
       .text('EWP Inspection Report', 50, 50, { align: 'center' });

    // Add company name
    doc.fontSize(16)
       .text(submission.company.name, 50, 80, { align: 'center' });

    // Add inspection date
    const inspectionDate = new Date(submission.inspectionDate).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    doc.fontSize(12)
       .text(`Date: ${inspectionDate}`, 50, 120, { align: 'right' });

    // Add submission ID
    doc.text(`Submission ID: ${submission.id}`, 50, 140, { align: 'right' });

    // Add inspector information
    doc.fontSize(14)
       .text('Inspector Information', 50, 180);
    
    doc.fontSize(12)
       .text(`Name: ${submission.inspectorFirstName} ${submission.inspectorLastName}`, 50, 200)
       .text(`EWP Type: ${submission.ewpType.replace(/_/g, ' ')}`, 50, 220)
       .text(`Asset Number: ${submission.assetNumber}`, 50, 240)
       .text(`Overall Result: ${submission.overallResult}`, 50, 260);

    // Add checklist results
    let yPosition = 300;
    
    const checklistSections = [
      { name: 'Paperwork Checks', data: submission.paperworkChecks },
      { name: 'General Maintenance Checks', data: submission.generalMaintenanceChecks },
      { name: 'Lower Unit Checks', data: submission.lowerUnitChecks },
      { name: 'Lower Controls Checks', data: submission.lowerControlsChecks },
      { name: 'Upper Controls Checks', data: submission.upperControlsChecks },
      { name: 'Work Area Checks', data: submission.workAreaChecks }
    ];

    checklistSections.forEach((section) => {
      if (section.data && section.data.length > 0) {
        doc.fontSize(14)
           .text(section.name, 50, yPosition);
        yPosition += 20;

        section.data.forEach((item) => {
          doc.fontSize(10)
             .text(`• ${item.label}: ${item.value.toUpperCase()}`, 70, yPosition);
          yPosition += 15;
        });
        
        yPosition += 10;
      }
    });

    // Add comments if any
    if (submission.comments && submission.comments.length > 0) {
      doc.fontSize(14)
         .text('Comments', 50, yPosition);
      yPosition += 20;

      submission.comments.forEach((comment) => {
        doc.fontSize(10)
           .text(`Item ${comment.itemNumber}: ${comment.comment}`, 70, yPosition, {
             width: 450,
             align: 'left'
           });
        yPosition += 25;
      });
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

// GET /api/ewp-inspection - Get all submissions for the company
router.get('/', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { companyId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      ewpType,
      overallResult,
      startDate, 
      endDate 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      companyId,
      ...(ewpType && { ewpType }),
      ...(overallResult && { overallResult }),
      ...(startDate && endDate && {
        inspectionDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.ewpInspectionSubmission.findMany({
        where,
        include: {
          form: {
            select: { formName: true }
          },
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { inspectionDate: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.ewpInspectionSubmission.count({ where })
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
    console.error('Error fetching EWP inspection submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// GET /api/ewp-inspection/submission/:id - Get specific submission
router.get('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const submission = await prisma.ewpInspectionSubmission.findFirst({
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
        message: 'EWP inspection submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching EWP inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
});

// PUT /api/ewp-inspection/submission/:id - Update submission
router.put('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;
    const updateData = req.body;

    // Find existing submission
    const existingSubmission = await prisma.ewpInspectionSubmission.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingSubmission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'EWP inspection submission not found'
      });
    }

    // Update submission
    const updatedSubmission = await prisma.ewpInspectionSubmission.update({
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
      message: 'Successfully updated EWP inspection submission',
      data: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating EWP inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update submission'
    });
  }
});

// GET /api/ewp-inspection/stats/dashboard - Get statistics
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
      passCount,
      failCount,
      reviewCount
    ] = await Promise.all([
      // Total inspections today
      prisma.ewpInspectionSubmission.count({
        where: {
          companyId,
          inspectionDate: { gte: today }
        }
      }),
      // Total this week
      prisma.ewpInspectionSubmission.count({
        where: {
          companyId,
          inspectionDate: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      // Total this month
      prisma.ewpInspectionSubmission.count({
        where: {
          companyId,
          inspectionDate: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
        }
      }),
      // Total all time
      prisma.ewpInspectionSubmission.count({
        where: { companyId }
      }),
      // Pass count
      prisma.ewpInspectionSubmission.count({
        where: { companyId, overallResult: 'PASS' }
      }),
      // Fail count
      prisma.ewpInspectionSubmission.count({
        where: { 
          companyId, 
          overallResult: { in: ['FAIL_MINOR_ISSUES', 'FAIL_CRITICAL_ISSUES'] }
        }
      }),
      // Review count
      prisma.ewpInspectionSubmission.count({
        where: { companyId, overallResult: 'REQUIRES_REVIEW' }
      })
    ]);

    res.json({
      success: true,
      data: {
        today: totalToday,
        thisWeek: totalThisWeek,
        thisMonth: totalThisMonth,
        total: totalAll,
        results: {
          pass: passCount,
          fail: failCount,
          review: reviewCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching EWP inspection stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;