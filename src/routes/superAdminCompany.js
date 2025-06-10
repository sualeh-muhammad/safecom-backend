// backend/routes/superAdminCompany.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { uploadToCloudinary, upload, handleMulterError } = require('../middleware/upload');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { initializeCompanyForms } = require('./forms');
const { generateTempPassword } = require('../utils/helpers');
const authService = require('../services/authService');
const { sendWelcomeEmail } = require('../services/emailService');
const yup = require('yup');

const router = express.Router();
const prisma = new PrismaClient();

// Transaction-aware form initialization function
async function initializeCompanyFormsInTransaction(tx, companyId, selectedForms = []) {
  console.log(`🎯 Initializing forms for company: ${companyId} within transaction`);
  console.log(`📋 Selected forms: ${selectedForms.join(', ')}`);

  // Helper function to determine form status
  const getFormStatus = (formKey) => selectedForms.includes(formKey) ? 'ACTIVE' : 'INACTIVE';

  // Create all forms with appropriate status using the transaction client
  await Promise.all([
    // ========== EXISTING FORMS (5) ==========
    tx.siteSignInForm.create({
      data: {
        companyId,
        formName: 'Site Sign-In',
        description: 'Daily worker sign-in form with time tracking',
        status: getFormStatus('siteSignIn')
      }
    }),
    tx.siteInductionForm.create({
      data: {
        companyId,
        formName: 'Site Induction',
        description: 'New worker safety induction and orientation',
        status: getFormStatus('siteInduction')
      }
    }),
    tx.safetyCheckForm.create({
      data: {
        companyId,
        formName: 'Safety Check',
        description: 'Daily site safety compliance checklist',
        status: getFormStatus('safetyCheck')
      }
    }),
    tx.incidentReportForm.create({
      data: {
        companyId,
        formName: 'Incident Report',
        description: 'Workplace incident or near-miss reporting',
        status: getFormStatus('incidentReport')
      }
    }),
    tx.dailyReportForm.create({
      data: {
        companyId,
        formName: 'Daily Report',
        description: 'End of day project status and progress report',
        status: getFormStatus('dailyReport')
      }
    }),

    // ========== NEW GENERAL FORMS (10) ==========
    tx.psychosocialHazardForm.create({
      data: {
        companyId,
        formName: 'Report Psychosocial Hazards',
        description: 'Documentation of workplace psychosocial hazards',
        status: getFormStatus('psychosocialHazard')
      }
    }),
    tx.companyInductionForm.create({
      data: {
        companyId,
        formName: 'Company Induction',
        description: 'Mandatory induction checklist for new workers',
        status: getFormStatus('companyInduction')
      }
    }),
    tx.preStartStaffForm.create({
      data: {
        companyId,
        formName: 'Pre Start Staff',
        description: 'Pre-work checklist for staff',
        status: getFormStatus('preStartStaff')
      }
    }),
    tx.dailyPreStartContractorForm.create({
      data: {
        companyId,
        formName: 'Daily Pre Start Contractors',
        description: 'Daily pre-work checklist for contractors',
        status: getFormStatus('dailyPreStartContractor')
      }
    }),
    tx.toolboxMeetingForm.create({
      data: {
        companyId,
        formName: 'Toolbox Meeting',
        description: 'Safety meeting documentation',
        status: getFormStatus('toolboxMeeting')
      }
    }),
    tx.hazardRiskAssessmentForm.create({
      data: {
        companyId,
        formName: 'Hazard Risk Assessment Form',
        description: 'Form to assess potential hazards on site',
        status: getFormStatus('hazardRiskAssessment')
      }
    }),
    tx.hazardReportForm.create({
      data: {
        companyId,
        formName: 'Hazard Report Form',
        description: 'Form to report hazards on site',
        status: getFormStatus('hazardReport')
      }
    }),
    tx.swmsInspectionForm.create({
      data: {
        companyId,
        formName: 'Spot & SWMS Inspection Checklist',
        description: 'Checklist for safety inspections and SWMS compliance',
        status: getFormStatus('swmsInspection')
      }
    }),
    tx.directorWorksiteChecklistForm.create({
      data: {
        companyId,
        formName: 'Director Worksite Checklist',
        description: 'Checklist for management review of worksite conditions',
        status: getFormStatus('directorWorksiteChecklist')
      }
    }),
    tx.taskCardForm.create({
      data: {
        companyId,
        formName: 'Task Card',
        description: 'Task card for management',
        status: getFormStatus('taskCard')
      }
    }),

    // ========== NEW INSPECTION FORMS (6) ==========
    tx.vehicleInspectionForm.create({
      data: {
        companyId,
        formName: 'Vehicle Inspection',
        description: 'Regular vehicle safety inspection form',
        status: getFormStatus('vehicleInspection')
      }
    }),
    tx.ewpInspectionForm.create({
      data: {
        companyId,
        formName: 'EWP Inspection',
        description: 'Elevated Work Platform inspection checklist',
        status: getFormStatus('ewpInspection')
      }
    }),
    tx.telehandlerInspectionForm.create({
      data: {
        companyId,
        formName: 'Telehandler Daily Inspection Checklist',
        description: 'Daily inspection for telehandler equipment',
        status: getFormStatus('telehandlerInspection')
      }
    }),
    tx.employeeChecklistForm.create({
      data: {
        companyId,
        formName: 'Employee / Subcontractor Checklist',
        description: 'Verification checklist for workers',
        status: getFormStatus('employeeChecklist')
      }
    }),
    tx.siteManagerInspectionForm.create({
      data: {
        companyId,
        formName: 'Quick Site Manager Daily Workplace Inspection',
        description: 'Daily site inspection checklist',
        status: getFormStatus('siteManagerInspection')
      }
    }),
    tx.detailedInspectionReportForm.create({
      data: {
        companyId,
        formName: 'SAFECOM HSEQ Advisor Detailed Inspection Report',
        description: 'Comprehensive site inspection report',
        status: getFormStatus('detailedInspectionReport')
      }
    })
  ]);

  // Count active and inactive forms
  const activeCount = selectedForms.length;
  const inactiveCount = 21 - activeCount; // Total 21 forms

  console.log(`✅ All 21 forms created for company: ${companyId} within transaction`);
  console.log(`📊 Forms Summary: ${activeCount} ACTIVE, ${inactiveCount} INACTIVE`);
  console.log(`🎯 Active Forms: ${selectedForms.join(', ')}`);

  return {
    total: 21,
    active: activeCount,
    inactive: inactiveCount,
    breakdown: {
      existingForms: 5,
      newGeneralForms: 10,
      newInspectionForms: 6
    }
  };
}

// Apply auth middleware and require SUPER_ADMIN role
router.use(authMiddleware);
router.use(requireRole(['SUPER_ADMIN']));

// Validation schema for company creation
const companyCreationSchema = yup.object({
  name: yup.string().required('Company name is required').min(2, 'Company name must be at least 2 characters'),
  subdomain: yup.string()
    .required('Subdomain is required')
    .min(2, 'Subdomain must be at least 2 characters')
    .max(50, 'Subdomain must be less than 50 characters')
    .matches(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  phone: yup.string().optional(),
  website: yup.string().url('Invalid website URL').optional().nullable(),
  streetAddress: yup.string().optional(),
  city: yup.string().optional(),
  state: yup.string().optional(),
  zipCode: yup.string().optional(),
  country: yup.string().default('USA'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  selectedForms: yup.array().of(yup.string()).default([])
});

// GET /api/super-admin/companies - Get all companies
router.get('/companies', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search filter
    const searchFilter = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    // Get companies with counts
    const [companies, totalCount] = await Promise.all([
      prisma.company.findMany({
        where: searchFilter,
        select: {
          id: true,
          name: true,
          subdomain: true,
          email: true,
          phone: true,
          logoImageUrl: true,
          currentPlan: true,
          subscriptionStatus: true,
          isActive: true,
          isManuallyCreated: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              jobSites: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.company.count({ where: searchFilter })
    ]);

    // Format response data
    const formattedCompanies = companies.map(company => ({
      id: company.id,
      name: company.name,
      subdomain: company.subdomain,
      email: company.email,
      phone: company.phone,
      logoImageUrl: company.logoImageUrl,
      planName: company.currentPlan,
      subscriptionStatus: company.subscriptionStatus,
      usersCount: company._count.users,
      jobSitesCount: company._count.jobSites,
      isActive: company.isActive,
      isManuallyCreated: company.isManuallyCreated,
      status: company.isActive ? 'active' : 'inactive',
      createdAt: company.createdAt
    }));

    res.json({
      success: true,
      data: formattedCompanies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies'
    });
  }
});

// GET /api/super-admin/companies/:id - Get company details
router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            lastLoginAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        },
        jobSites: {
          select: {
            id: true,
            jobsiteName: true,
            city: true,
            state: true,
            isActive: true,
            createdAt: true
          }
        },
        paymentHistory: {
          select: {
            id: true,
            transactionId: true,
            date: true,
            amount: true,
            plan: true,
            paymentMethod: true,
            status: true
          },
          orderBy: { date: 'desc' },
          take: 10
        },
        _count: {
          select: {
            users: true,
            jobSites: true,
            paymentHistory: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Calculate statistics
    const stats = {
      totalUsers: company._count.users,
      totalJobSites: company._count.jobSites,
      totalPayments: company._count.paymentHistory,
      activeJobSites: company.jobSites.filter(js => js.isActive).length
    };

    // Format admin user (first user)
    const adminUser = company.users.find(user => user.role === 'ADMIN') || company.users[0];

    res.json({
      success: true,
      data: {
        ...company,
        stats,
        adminUser,
        recentPayments: company.paymentHistory
      }
    });

  } catch (error) {
    console.error('Error fetching company details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company details'
    });
  }
});

// GET /api/super-admin/available-forms - Get all available form types
router.get('/available-forms', async (req, res) => {
  try {
    const availableForms = [
      // EXISTING FORMS
      { key: 'siteSignIn', name: 'Site Sign-In', description: 'Daily worker sign-in form with time tracking', category: 'General' },
      // { key: 'siteInduction', name: 'Site Induction', description: 'New worker safety induction and orientation', category: 'General' },
      // { key: 'safetyCheck', name: 'Safety Check', description: 'Daily site safety compliance checklist', category: 'General' },
      { key: 'incidentReport', name: 'Incident Report', description: 'Workplace incident or near-miss reporting', category: 'General' },
      // { key: 'dailyReport', name: 'Daily Report', description: 'End of day project status and progress report', category: 'General' },
      
      // NEW GENERAL FORMS
      { key: 'psychosocialHazard', name: 'Psychosocial Hazards', description: 'Documentation of workplace psychosocial hazards', category: 'General' },
      { key: 'companyInduction', name: 'Company Induction', description: 'Mandatory induction checklist for new workers', category: 'General' },
      { key: 'preStartStaff', name: 'Pre Start Staff', description: 'Pre-work checklist for staff', category: 'General' },
      { key: 'dailyPreStartContractor', name: 'Daily Pre Start Contractors', description: 'Daily pre-work checklist for contractors', category: 'General' },
      { key: 'toolboxMeeting', name: 'Toolbox Meeting', description: 'Safety meeting documentation', category: 'General' },
      { key: 'hazardRiskAssessment', name: 'Hazard Risk Assessment', description: 'Form to assess potential hazards on site', category: 'General' },
      { key: 'hazardReport', name: 'Hazard Report', description: 'Form to report hazards on site', category: 'General' },
      { key: 'swmsInspection', name: 'SWMS Inspection', description: 'Checklist for safety inspections and SWMS compliance', category: 'General' },
      { key: 'directorWorksiteChecklist', name: 'Director Worksite Checklist', description: 'Checklist for management review of worksite conditions', category: 'General' },
      { key: 'taskCard', name: 'Task Card', description: 'Task card for management', category: 'General' },
      
      // NEW INSPECTION FORMS
      { key: 'vehicleInspection', name: 'Vehicle Inspection', description: 'Regular vehicle safety inspection form', category: 'Inspection' },
      { key: 'ewpInspection', name: 'EWP Inspection', description: 'Elevated Work Platform inspection checklist', category: 'Inspection' },
      { key: 'telehandlerInspection', name: 'Telehandler Inspection', description: 'Daily inspection for telehandler equipment', category: 'Inspection' },
      { key: 'employeeChecklist', name: 'Employee Checklist', description: 'Verification checklist for workers', category: 'Inspection' },
      { key: 'siteManagerInspection', name: 'Site Manager Inspection', description: 'Daily site inspection checklist', category: 'Inspection' },
      { key: 'detailedInspectionReport', name: 'Detailed Inspection Report', description: 'Comprehensive site inspection report', category: 'Inspection' }
    ];

    // Group by category
    const groupedForms = availableForms.reduce((acc, form) => {
      if (!acc[form.category]) {
        acc[form.category] = [];
      }
      acc[form.category].push(form);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        forms: availableForms,
        grouped: groupedForms,
        stats: {
          total: availableForms.length,
          general: availableForms.filter(f => f.category === 'General').length,
          inspection: availableForms.filter(f => f.category === 'Inspection').length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching available forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available forms'
    });
  }
});

// POST /api/super-admin/companies - Create new company
router.post('/companies', upload.single('logo'), async (req, res) => {
  try {
    console.log('📝 Creating company - Super Admin:', req.user.userId);
    console.log('📦 Form data received:', req.body);
    console.log('🖼️ Logo file:', req.file ? 'Present' : 'Not provided');

    // Parse selectedForms from JSON string if it exists
    let parsedBody = { ...req.body };
    if (req.body.selectedForms && typeof req.body.selectedForms === 'string') {
      try {
        parsedBody.selectedForms = JSON.parse(req.body.selectedForms);
      } catch (parseError) {
        console.error('Error parsing selectedForms:', parseError);
        parsedBody.selectedForms = [];
      }
    }

    // Validate input data
    const validatedData = await companyCreationSchema.validate(parsedBody, { 
      abortEarly: false,
      stripUnknown: true
    });

    console.log('✅ Validation passed:', validatedData);

    // Check if subdomain already exists
    const existingSubdomain = await prisma.company.findUnique({
      where: { subdomain: validatedData.subdomain }
    });

    if (existingSubdomain) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain is already taken'
      });
    }

    // Check if email already exists as a company email
    const existingCompanyEmail = await prisma.company.findUnique({
      where: { email: validatedData.email }
    });

    if (existingCompanyEmail) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a company email'
      });
    }

    // Check if email already exists as a user email
    const existingUserEmail = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUserEmail) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a user email'
      });
    }

    // Handle logo upload if provided
    let logoImageUrl = null;
    if (req.file) {
      console.log('🖼️ Uploading logo to Cloudinary...');
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'company-logos',
          public_id: `company_${validatedData.subdomain}_logo_${Date.now()}`,
          transformation: [
            { width: 512, height: 512, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        });
        logoImageUrl = uploadResult.secure_url;
        console.log('✅ Logo uploaded successfully:', logoImageUrl);
      } catch (uploadError) {
        console.error('❌ Logo upload failed:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload logo'
        });
      }
    }

    // Create company with transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create company
      const company = await tx.company.create({
        data: {
          name: validatedData.name,
          subdomain: validatedData.subdomain,
          email: validatedData.email,
          phone: validatedData.phone || null,
          website: validatedData.website || null,
          logoImageUrl,
          streetAddress: validatedData.streetAddress || null,
          city: validatedData.city || null,
          state: validatedData.state || null,
          zipCode: validatedData.zipCode || null,
          country: validatedData.country,
          currentPlan: 'BASIC', // Default plan for super admin created companies
          subscriptionStatus: 'ACTIVE',
          isActive: true,
          isManuallyCreated: true,
          createdBySuperId: req.user.userId
        }
      });

      console.log('✅ Company created:', company.id);

      // 2. Initialize forms with selected ones as ACTIVE (within transaction)
      console.log('🎯 Initializing forms with selection:', validatedData.selectedForms);
      await initializeCompanyFormsInTransaction(tx, company.id, validatedData.selectedForms);

      // 3. Create admin user (within transaction)
      const tempPassword = generateTempPassword();
      const hashedPassword = await authService.hashPassword(tempPassword);
      
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });

      console.log('✅ Admin user created:', user.id);

      // 4. Send welcome email
      try {
        await sendWelcomeEmail({
          email: validatedData.email,
          companyName: validatedData.name,
          subdomain: validatedData.subdomain,
          firstName: validatedData.firstName,
          tempPassword,
          loginUrl: `${process.env.FRONTEND_URL}/login`
        });
        console.log('✅ Welcome email sent');
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError);
        // Don't fail the entire process for email errors
      }

      return { company, user, tempPassword };
    });

    console.log('🎉 Company creation completed successfully');

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company: {
          id: result.company.id,
          name: result.company.name,
          subdomain: result.company.subdomain,
          email: result.company.email,
          logoImageUrl: result.company.logoImageUrl
        },
        adminUser: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName
        },
        formsInitialized: validatedData.selectedForms.length,
        loginCredentials: {
          email: validatedData.email,
          temporaryPassword: result.tempPassword
        }
      }
    });

  } catch (error) {
    console.error('❌ Error creating company:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create company'
    });
  }
});

// PATCH /api/super-admin/companies/:id/status - Toggle company status
router.patch('/companies/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    console.log(`🔄 Toggling company status - ID: ${id}, New Status: ${isActive}`);

    // Validate the isActive parameter
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true }
    });

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Update company status
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true
      }
    });

    console.log(`✅ Company status updated: ${updatedCompany.name} - ${isActive ? 'ACTIVE' : 'INACTIVE'}`);

    res.json({
      success: true,
      message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedCompany
    });

  } catch (error) {
    console.error('❌ Error updating company status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company status'
    });
  }
});

// Error handling middleware
router.use(handleMulterError);

module.exports = router;