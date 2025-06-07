// routes/superAdmin.js - Complete Super Admin Backend Routes

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const superAdminAuthService = require('../services/superAdminAuthService');
const authService = require('../services/authService');
const { initializeCompanyForms } = require('./forms');
const { generateTempPassword, isValidSubdomain, sanitizeSubdomain } = require('../utils/helpers');
const { uploadToCloudinary, upload } = require('../middleware/upload');

const router = express.Router();
const prisma = new PrismaClient();

// Super Admin Auth Middleware
const superAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Super Admin access required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = superAdminAuthService.verifyToken(token);
    
    if (decoded.type !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    req.superAdmin = {
      id: decoded.superAdminId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid super admin token' });
  }
};

// ====================== AUTH ROUTES ======================

// Super Admin Login (no auth required)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await superAdminAuthService.login(email, password);
    
    res.json({
      message: 'Super Admin login successful',
      ...result
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Apply auth middleware to all subsequent routes
router.use(superAdminAuth);

// Get Super Admin Profile
router.get('/profile', async (req, res) => {
  try {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: req.superAdmin.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        canManageCompanies: true,
        canViewPayments: true,
        canAccessReports: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json(superAdmin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ====================== COMPANY ROUTES ======================

// Get all companies with stats
router.get('/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: { 
          select: { 
            users: true,
            siteSignInForms: true,
            siteInductionForms: true,
            safetyCheckForms: true,
            incidentReportForms: true,
            dailyReportForms: true,
            psychosocialHazardForms: true,
            companyInductionForms: true,
            preStartStaffForms: true,
            dailyPreStartContractorForms: true,
            toolboxMeetingForms: true,
            hazardRiskAssessmentForms: true,
            hazardReportForms: true,
            swmsInspectionForms: true,
            directorWorksiteChecklistForms: true,
            taskCardForms: true,
            vehicleInspectionForms: true,
            ewpInspectionForms: true,
            telehandlerInspectionForms: true,
            employeeChecklistForms: true,
            siteManagerInspectionForms: true,
            detailedInspectionReportForms: true
          } 
        },
        users: {
          where: { role: 'ADMIN' },
          take: 1,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            lastLoginAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total forms for each company
    const companiesWithStats = companies.map(company => {
      const formCounts = Object.entries(company._count)
        .filter(([key]) => key.endsWith('Forms'))
        .reduce((sum, [, count]) => sum + count, 0);
      
      return {
        ...company,
        totalForms: formCounts,
        adminUser: company.users[0] || null
      };
    });

    res.json(companiesWithStats);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get single company details
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
          }
        },
        jobSites: {
          select: {
            id: true,
            jobsiteName: true,
            isActive: true,
            createdAt: true
          }
        },
        // Include all form types with their details
        siteSignInForms: { select: { id: true, formName: true, status: true } },
        siteInductionForms: { select: { id: true, formName: true, status: true } },
        safetyCheckForms: { select: { id: true, formName: true, status: true } },
        incidentReportForms: { select: { id: true, formName: true, status: true } },
        dailyReportForms: { select: { id: true, formName: true, status: true } },
        psychosocialHazardForms: { select: { id: true, formName: true, status: true } },
        companyInductionForms: { select: { id: true, formName: true, status: true } },
        preStartStaffForms: { select: { id: true, formName: true, status: true } },
        dailyPreStartContractorForms: { select: { id: true, formName: true, status: true } },
        toolboxMeetingForms: { select: { id: true, formName: true, status: true } },
        hazardRiskAssessmentForms: { select: { id: true, formName: true, status: true } },
        hazardReportForms: { select: { id: true, formName: true, status: true } },
        swmsInspectionForms: { select: { id: true, formName: true, status: true } },
        directorWorksiteChecklistForms: { select: { id: true, formName: true, status: true } },
        taskCardForms: { select: { id: true, formName: true, status: true } },
        vehicleInspectionForms: { select: { id: true, formName: true, status: true } },
        ewpInspectionForms: { select: { id: true, formName: true, status: true } },
        telehandlerInspectionForms: { select: { id: true, formName: true, status: true } },
        employeeChecklistForms: { select: { id: true, formName: true, status: true } },
        siteManagerInspectionForms: { select: { id: true, formName: true, status: true } },
        detailedInspectionReportForms: { select: { id: true, formName: true, status: true } }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Create new company
router.post('/companies', async (req, res) => {
  try {
    const {
      name,
      subdomain,
      email,
      phone,
      website,
      streetAddress,
      city,
      state,
      zipCode,
      country,
      adminFirstName,
      adminLastName,
      selectedForms = [], // Array of form types to activate
      plan = 'BASIC'
    } = req.body;

    // Validation
    if (!name || !subdomain || !email || !adminFirstName || !adminLastName) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, subdomain, email, adminFirstName, adminLastName' 
      });
    }

    const sanitizedSubdomain = sanitizeSubdomain(subdomain);
    if (!isValidSubdomain(sanitizedSubdomain)) {
      return res.status(400).json({ error: 'Invalid subdomain format' });
    }

    // Check for existing subdomain
    const existingSubdomain = await prisma.company.findUnique({
      where: { subdomain: sanitizedSubdomain }
    });
    if (existingSubdomain) {
      return res.status(409).json({ error: 'Subdomain already exists' });
    }

    // Check for existing email
    const existingEmail = await prisma.company.findUnique({
      where: { email }
    });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        subdomain: sanitizedSubdomain,
        email,
        phone,
        website,
        streetAddress,
        city,
        state,
        zipCode,
        country: country || 'USA',
        currentPlan: plan.toUpperCase(),
        isManuallyCreated: true,
        createdBySuperId: req.superAdmin.id,
        subscriptionStatus: 'ACTIVE',
        isActive: true
      }
    });

    // Initialize forms (create all forms, activate only selected ones)
    await initializeCompanyForms(company.id, selectedForms);

    // Create admin user for the company
    const tempPassword = generateTempPassword();
    const adminUser = await authService.createUser({
      companyId: company.id,
      email: email,
      firstName: adminFirstName,
      lastName: adminLastName,
      password: tempPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    res.status(201).json({
      company,
      adminUser: { 
        ...adminUser, 
        tempPassword // Include temp password for super admin to share
      },
      message: 'Company created successfully'
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: error.message || 'Failed to create company' });
  }
});

// Update company
router.patch('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.subdomain; // Subdomain should not be changeable

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        users: {
          where: { role: 'ADMIN' },
          take: 1,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Toggle company status
router.patch('/companies/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      company: updatedCompany,
      message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling company status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(500).json({ error: 'Failed to update company status' });
  }
});

// Upload company logo
router.post('/companies/:id/logo', upload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'super-admin-company-logos',
      public_id: `company_${id}_logo_${Date.now()}`,
      transformation: [
        { width: 512, height: 512, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    });

    // Update company with new logo URL
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { logoImageUrl: uploadResult.secure_url },
      select: { id: true, name: true, logoImageUrl: true }
    });

    res.json({
      success: true,
      data: { logoImageUrl: updatedCompany.logoImageUrl },
      message: 'Logo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Update company forms status
router.patch('/companies/:id/forms', async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedForms } = req.body;

    if (!Array.isArray(selectedForms)) {
      return res.status(400).json({ error: 'selectedForms must be an array' });
    }

    // Get all form types
    const formTypes = [
      'siteSignIn', 'siteInduction', 'safetyCheck', 'incidentReport', 'dailyReport',
      'psychosocialHazard', 'companyInduction', 'preStartStaff', 'dailyPreStartContractor',
      'toolboxMeeting', 'hazardRiskAssessment', 'hazardReport', 'swmsInspection',
      'directorWorksiteChecklist', 'taskCard', 'vehicleInspection', 'ewpInspection',
      'telehandlerInspection', 'employeeChecklist', 'siteManagerInspection', 'detailedInspectionReport'
    ];

    // Update each form type status
    const updatePromises = formTypes.map(async (formType) => {
      const tableName = `${formType}Form`;
      const status = selectedForms.includes(formType) ? 'ACTIVE' : 'INACTIVE';
      
      try {
        // Update form status based on the form type
        switch (formType) {
          case 'siteSignIn':
            await prisma.siteSignInForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'siteInduction':
            await prisma.siteInductionForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'safetyCheck':
            await prisma.safetyCheckForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'incidentReport':
            await prisma.incidentReportForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'dailyReport':
            await prisma.dailyReportForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'psychosocialHazard':
            await prisma.psychosocialHazardForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'companyInduction':
            await prisma.companyInductionForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'preStartStaff':
            await prisma.preStartStaffForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'dailyPreStartContractor':
            await prisma.dailyPreStartContractorForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'toolboxMeeting':
            await prisma.toolboxMeetingForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'hazardRiskAssessment':
            await prisma.hazardRiskAssessmentForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'hazardReport':
            await prisma.hazardReportForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'swmsInspection':
            await prisma.swmsInspectionForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'directorWorksiteChecklist':
            await prisma.directorWorksiteChecklistForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'taskCard':
            await prisma.taskCardForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'vehicleInspection':
            await prisma.vehicleInspectionForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'ewpInspection':
            await prisma.ewpInspectionForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'telehandlerInspection':
            await prisma.telehandlerInspectionForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'employeeChecklist':
            await prisma.employeeChecklistForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'siteManagerInspection':
            await prisma.siteManagerInspectionForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          case 'detailedInspectionReport':
            await prisma.detailedInspectionReportForm.updateMany({
              where: { companyId: id },
              data: { status }
            });
            break;
          default:
            console.warn(`Unknown form type: ${formType}`);
        }
      } catch (error) {
        console.error(`Error updating ${formType} forms:`, error);
      }
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Company forms updated successfully',
      selectedForms
    });
  } catch (error) {
    console.error('Error updating company forms:', error);
    res.status(500).json({ error: 'Failed to update company forms' });
  }
});

// Get available form types
router.get('/form-types', async (req, res) => {
  try {
    const formTypes = [
      // General Forms
      { key: 'siteSignIn', label: 'Site Sign-In', description: 'Daily worker sign-in form with time tracking', category: 'General' },
      { key: 'siteInduction', label: 'Site Induction', description: 'New worker safety induction and orientation', category: 'General' },
      { key: 'safetyCheck', label: 'Safety Check', description: 'Daily site safety compliance checklist', category: 'General' },
      { key: 'incidentReport', label: 'Incident Report', description: 'Workplace incident or near-miss reporting', category: 'General' },
      { key: 'dailyReport', label: 'Daily Report', description: 'End of day project status and progress report', category: 'General' },
      { key: 'psychosocialHazard', label: 'Psychosocial Hazards', description: 'Documentation of workplace psychosocial hazards', category: 'General' },
      { key: 'companyInduction', label: 'Company Induction', description: 'Mandatory induction checklist for new workers', category: 'General' },
      { key: 'preStartStaff', label: 'Pre Start Staff', description: 'Pre-work checklist for staff', category: 'General' },
      { key: 'dailyPreStartContractor', label: 'Daily Pre Start Contractors', description: 'Daily pre-work checklist for contractors', category: 'General' },
      { key: 'toolboxMeeting', label: 'Toolbox Meeting', description: 'Safety meeting documentation', category: 'General' },
      { key: 'hazardRiskAssessment', label: 'Hazard Risk Assessment', description: 'Form to assess potential hazards on site', category: 'General' },
      { key: 'hazardReport', label: 'Hazard Report', description: 'Form to report hazards on site', category: 'General' },
      { key: 'swmsInspection', label: 'SWMS Inspection', description: 'Checklist for safety inspections and SWMS compliance', category: 'General' },
      { key: 'directorWorksiteChecklist', label: 'Director Worksite Checklist', description: 'Checklist for management review of worksite conditions', category: 'General' },
      { key: 'taskCard', label: 'Task Card', description: 'Task card for management', category: 'General' },
      
      // Inspection Forms
      { key: 'vehicleInspection', label: 'Vehicle Inspection', description: 'Regular vehicle safety inspection form', category: 'Inspection' },
      { key: 'ewpInspection', label: 'EWP Inspection', description: 'Elevated Work Platform inspection checklist', category: 'Inspection' },
      { key: 'telehandlerInspection', label: 'Telehandler Inspection', description: 'Daily inspection for telehandler equipment', category: 'Inspection' },
      { key: 'employeeChecklist', label: 'Employee Checklist', description: 'Verification checklist for workers', category: 'Inspection' },
      { key: 'siteManagerInspection', label: 'Site Manager Inspection', description: 'Daily site inspection checklist', category: 'Inspection' },
      { key: 'detailedInspectionReport', label: 'Detailed Inspection Report', description: 'Comprehensive site inspection report', category: 'Inspection' }
    ];

    res.json(formTypes);
  } catch (error) {
    console.error('Error fetching form types:', error);
    res.status(500).json({ error: 'Failed to fetch form types' });
  }
});

// ====================== DASHBOARD STATS ======================

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalSubmissions
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.user.count(),
      // Count total submissions across all form types
      Promise.all([
        prisma.siteSignInSubmission.count(),
        prisma.siteInductionSubmission.count(),
        prisma.safetyCheckSubmission.count(),
        prisma.incidentReportSubmission.count(),
        prisma.dailyReportSubmission.count()
        // Add other submission counts as needed
      ]).then(counts => counts.reduce((sum, count) => sum + count, 0))
    ]);

    // Get recent companies (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCompanies = await prisma.company.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    res.json({
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalSubmissions,
      recentCompanies,
      inactiveCompanies: totalCompanies - activeCompanies
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'SuperAdmin routes working!',
    timestamp: new Date().toISOString(),
    superAdmin: req.superAdmin
  });
});

module.exports = router;