// routes/siteManagerInspection.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { upload, uploadMultipleToCloudinary, uploadBase64ImagesToCloudinary, handleMulterError } = require('../../middleware/upload');
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
          console.log('Invalid token provided, continuing without auth:', tokenError.message);
        }
      }
    }
    
    next();

  } catch (error) {
    console.log('Auth error, continuing without auth:', error.message);
    next();
  }
};

// PUBLIC ROUTES (no auth required)

// GET /api/site-manager-inspection/form/:formId - Get form details by form ID (PUBLIC ACCESS)
router.get('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    console.log('🔍 Looking for site manager inspection form with ID:', formId);

    // Find the form and get company details
    const form = await prisma.siteManagerInspectionForm.findUnique({
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
        message: 'The requested site manager inspection form does not exist'
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
    console.error('Error fetching site manager inspection form details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch form details'
    });
  }
});

// POST /api/site-manager-inspection/upload-images - Upload images to Cloudinary
router.post('/upload-images', optionalAuthMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const { section } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    if (!section) {
      return res.status(400).json({
        success: false,
        message: 'Section is required'
      });
    }

    console.log(`📸 Uploading ${files.length} images for section: ${section}`);

    // Upload images to Cloudinary
    const uploadedImages = await uploadMultipleToCloudinary(files, `site-inspection/${section}`);

    res.json({
      success: true,
      data: {
        section,
        images: uploadedImages
      }
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
}, handleMulterError);

// POST /api/site-manager-inspection/:formId - Create new submission (PUBLIC ACCESS with optional auth)
router.post('/:formId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { formId } = req.params;
    const {
      siteName,
      companyName,
      positionHeld,
      firstName,
      lastName,
      mobileNumber,
      email,
      comments,
      signature,
      sectionsData,
      photos
    } = req.body;

    console.log('📝 Creating site manager inspection submission for form:', formId);
    console.log('👤 User authenticated:', !!req.user);

    // Validation
    if (!siteName || !firstName || !lastName || !mobileNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'siteName, firstName, lastName, and mobileNumber are required'
      });
    }

    // Find the form and get the company ID from it
    const form = await prisma.siteManagerInspectionForm.findUnique({
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
        message: 'Site manager inspection form not found'
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
    
    if (req.user) {
      userId = req.user.userId;
      console.log('🔐 Using authenticated user ID:', userId);
    } else {
      console.log('👤 Creating public submission');
    }

    // Process sections data to extract individual sections
    const processedSectionsData = sectionsData || {};

    // Create submission
    const submission = await prisma.siteManagerInspectionSubmission.create({
      data: {
        companyId,
        formId,
        userId,
        siteName,
        companyName,
        positionHeld,
        firstName,
        lastName,
        mobileNumber,
        email,
        comments,
        signature,
        // Store section data in separate JSON fields
        housekeepingData: processedSectionsData.housekeeping || null,
        workAtHeightsData: processedSectionsData.workAtHeights || null,
        electricalData: processedSectionsData.electrical || null,
        plantEquipmentData: processedSectionsData.plantEquipment || null,
        hazardousSubstancesData: processedSectionsData.hazardousSubstances || null,
        accessLaddersData: processedSectionsData.accessLaddersScaffolding || null,
        trafficControlData: processedSectionsData.trafficControl || null,
        exclusionZonesData: processedSectionsData.exclusionZones || null,
        ppeData: processedSectionsData.ppe || null,
        storageData: processedSectionsData.storage || null,
        publicProtectionData: processedSectionsData.publicProtection || null,
        amenitiesData: processedSectionsData.amenities || null,
        fireProtectionData: processedSectionsData.fireProtection || null,
        overheadPowerlinesData: processedSectionsData.overheadPowerlines || null,
        safeworkEpaData: processedSectionsData.safeworkEpa || null,
        photos: photos || null,
        status: 'SUBMITTED'
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
    await prisma.siteManagerInspectionForm.update({
      where: { id: formId },
      data: {
        submissionCount: { increment: 1 }
      }
    });

    console.log('✅ Site manager inspection submission created successfully:', submission.id);

    res.status(201).json({
      success: true,
      message: 'Site manager inspection submitted successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error creating site manager inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process site manager inspection submission'
    });
  }
});

// GET /api/site-manager-inspection/pdf/:submissionId - Generate PDF (PUBLIC ACCESS)
router.get('/pdf/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;

    console.log('📄 Generating PDF for submission:', submissionId);

    // Find the submission with company details
    const submission = await prisma.siteManagerInspectionSubmission.findUnique({
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
    res.setHeader('Content-Disposition', `attachment; filename="site-manager-inspection-${submissionId}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20)
       .text('SITE MANAGER DAILY WORKPLACE INSPECTION', 50, 50, { align: 'center' });

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

    // Add inspector information
    doc.fontSize(14)
       .text('Inspector Information', 50, 180);
    
    doc.fontSize(12)
       .text(`Name: ${submission.firstName} ${submission.lastName}`, 50, 200)
       .text(`Mobile: ${submission.mobileNumber}`, 50, 220)
       .text(`Site: ${submission.siteName}`, 50, 240);

    if (submission.email) {
      doc.text(`Email: ${submission.email}`, 50, 260);
    }

    // Add sections data
    let yPos = 300;
    
    const sections = [
      { key: 'housekeepingData', title: '1. HOUSEKEEPING & PERIMETER' },
      { key: 'workAtHeightsData', title: '2. WORK AT HEIGHTS' },
      { key: 'electricalData', title: '3. ELECTRICAL' },
      { key: 'plantEquipmentData', title: '4. PLANT & MOBILE EQUIPMENT' },
      { key: 'hazardousSubstancesData', title: '5. HAZARDOUS SUBSTANCES' },
      { key: 'accessLaddersData', title: '6. ACCESS/LADDERS/SCAFFOLDING' },
      { key: 'trafficControlData', title: '7. TRAFFIC CONTROL' },
      { key: 'exclusionZonesData', title: '8. EXCLUSION ZONES' },
      { key: 'ppeData', title: '9. PERSONAL PROTECTIVE EQUIPMENT' },
      { key: 'storageData', title: '10. STORAGE & CONTAINMENT' },
      { key: 'publicProtectionData', title: '11. PUBLIC & SITE PROTECTION' },
      { key: 'amenitiesData', title: '12. AMENITIES' },
      { key: 'fireProtectionData', title: '13. FIRE PROTECTION' },
      { key: 'overheadPowerlinesData', title: '14. OVERHEAD POWERLINES' },
      { key: 'safeworkEpaData', title: '15. SAFEWORK-EPA VISITS' }
    ];

    sections.forEach((section) => {
      const sectionData = submission[section.key];
      if (sectionData && Object.keys(sectionData).length > 0) {
        // Check if we need a new page
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        doc.fontSize(14)
           .text(section.title, 50, yPos);
        yPos += 20;

        // Add section responses
        Object.entries(sectionData).forEach(([key, value]) => {
          if (!key.includes('_comment') && key !== 'photos' && value) {
            doc.fontSize(10)
               .text(`${key}: ${value}`, 60, yPos);
            yPos += 15;

            // Add comment if exists
            const comment = sectionData[`${key}_comment`];
            if (comment) {
              doc.fontSize(9)
                 .text(`Comment: ${comment}`, 70, yPos);
              yPos += 15;
            }
          }
        });

        yPos += 10;
      }
    });

    // Add comments if present
    if (submission.comments) {
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }

      doc.fontSize(14)
         .text('Additional Comments', 50, yPos);
      yPos += 20;

      doc.fontSize(11)
         .text(submission.comments, 50, yPos, {
           width: 500,
           align: 'left'
         });
    }

    // Add footer
    const pageHeight = doc.page.height;
    doc.fontSize(10)
       .text('This document is generated automatically and is valid without signature.', 
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

// GET /api/site-manager-inspection - Get all submissions for the company
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
      prisma.siteManagerInspectionSubmission.findMany({
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
      prisma.siteManagerInspectionSubmission.count({ where })
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
    console.error('Error fetching site manager inspection submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// GET /api/site-manager-inspection/submission/:id - Get specific submission
router.get('/submission/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const submission = await prisma.siteManagerInspectionSubmission.findFirst({
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
        message: 'Site manager inspection submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching site manager inspection submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
});

module.exports = router;