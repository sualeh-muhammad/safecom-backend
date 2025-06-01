// routes/publicForms.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { createHash, verifyHash, findCompanyByHash } = require('../utils/hashUtils');

const router = express.Router();
const prisma = new PrismaClient();

// Get public forms by hash
router.get('/forms/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    console.log(`🔍 Looking up forms for hash: ${hash}`);

    // Validate hash format (should be 16 hex characters)
    if (!/^[a-f0-9]{16}$/i.test(hash)) {
      return res.status(404).json({
        error: 'Invalid URL',
        message: 'The requested page could not be found'
      });
    }

    // Find company by hash
    const company = await findCompanyByHash(hash, prisma);
    
    if (!company) {
      console.log(`❌ No company found for hash: ${hash}`);
      return res.status(404).json({
        error: 'Company not found',
        message: 'The requested company could not be found or is no longer active'
      });
    }

    console.log(`✅ Found company: ${company.name} (ID: ${company.id})`);

    // Get only ACTIVE forms for the company
    const [
      // EXISTING FORMS
      siteSignInForms,
      siteInductionForms,
      safetyCheckForms,
      incidentReportForms,
      dailyReportForms,
      
      // NEW GENERAL FORMS
      psychosocialHazardForms,
      companyInductionForms,
      preStartStaffForms,
      dailyPreStartContractorForms,
      toolboxMeetingForms,
      hazardRiskAssessmentForms,
      hazardReportForms,
      swmsInspectionForms,
      directorWorksiteChecklistForms,
      taskCardForms,
      
      // NEW INSPECTION FORMS
      vehicleInspectionForms,
      ewpInspectionForms,
      telehandlerInspectionForms,
      employeeChecklistForms,
      siteManagerInspectionForms,
      detailedInspectionReportForms
    ] = await Promise.all([
      // EXISTING FORMS
      prisma.siteSignInForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.siteInductionForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.safetyCheckForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.incidentReportForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.dailyReportForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      
      // NEW GENERAL FORMS
      prisma.psychosocialHazardForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.companyInductionForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.preStartStaffForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.dailyPreStartContractorForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.toolboxMeetingForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.hazardRiskAssessmentForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.hazardReportForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.swmsInspectionForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.directorWorksiteChecklistForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.taskCardForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      
      // NEW INSPECTION FORMS
      prisma.vehicleInspectionForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.ewpInspectionForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.telehandlerInspectionForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.employeeChecklistForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.siteManagerInspectionForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      }),
      prisma.detailedInspectionReportForm.findMany({
        where: { companyId: company.id, status: 'ACTIVE' }
      })
    ]);

    // Get full company details
    const fullCompany = await prisma.company.findUnique({
      where: { id: company.id },
      select: {
        id: true,
        name: true,
        subdomain: true,
        logoImageUrl: true,
        website: true,
        phone: true,
        email: true
      }
    });

    // Format all ACTIVE forms into a unified structure
    const activeForms = [
      // EXISTING FORMS
      ...siteSignInForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Site Sign-In',
        formType: 'siteSignIn',
        category: 'General',
        publicUrl: `/forms/${hash}/form/siteSignIn/${form.id}`
      })),
      ...siteInductionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Site Induction',
        formType: 'siteInduction',
        category: 'General',
        publicUrl: `/forms/${hash}/form/siteInduction/${form.id}`
      })),
      ...safetyCheckForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Safety Check',
        formType: 'safetyCheck',
        category: 'General',
        publicUrl: `/forms/${hash}/form/safetyCheck/${form.id}`
      })),
      ...incidentReportForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Incident Report',
        formType: 'incidentReport',
        category: 'General',
        publicUrl: `/forms/${hash}/form/incidentReport/${form.id}`
      })),
      ...dailyReportForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Daily Report',
        formType: 'dailyReport',
        category: 'General',
        publicUrl: `/forms/${hash}/form/dailyReport/${form.id}`
      })),
      
      // NEW GENERAL FORMS
      ...psychosocialHazardForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Psychosocial Hazards',
        formType: 'psychosocialHazard',
        category: 'General',
        publicUrl: `/forms/${hash}/form/psychosocialHazard/${form.id}`
      })),
      ...companyInductionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Company Induction',
        formType: 'companyInduction',
        category: 'General',
        publicUrl: `/forms/${hash}/form/companyInduction/${form.id}`
      })),
      ...preStartStaffForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Pre Start Staff',
        formType: 'preStartStaff',
        category: 'General',
        publicUrl: `/forms/${hash}/form/preStartStaff/${form.id}`
      })),
      ...dailyPreStartContractorForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Daily Pre Start Contractors',
        formType: 'dailyPreStartContractor',
        category: 'General',
        publicUrl: `/forms/${hash}/form/dailyPreStartContractor/${form.id}`
      })),
      ...toolboxMeetingForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Toolbox Meeting',
        formType: 'toolboxMeeting',
        category: 'General',
        publicUrl: `/forms/${hash}/form/toolboxMeeting/${form.id}`
      })),
      ...hazardRiskAssessmentForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Hazard Risk Assessment',
        formType: 'hazardRiskAssessment',
        category: 'General',
        publicUrl: `/forms/${hash}/form/hazardRiskAssessment/${form.id}`
      })),
      ...hazardReportForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Hazard Report',
        formType: 'hazardReport',
        category: 'General',
        publicUrl: `/forms/${hash}/form/hazardReport/${form.id}`
      })),
      ...swmsInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'SWMS Inspection',
        formType: 'swmsInspection',
        category: 'General',
        publicUrl: `/forms/${hash}/form/swmsInspection/${form.id}`
      })),
      ...directorWorksiteChecklistForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Director Worksite Checklist',
        formType: 'directorWorksiteChecklist',
        category: 'General',
        publicUrl: `/forms/${hash}/form/directorWorksiteChecklist/${form.id}`
      })),
      ...taskCardForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Task Card',
        formType: 'taskCard',
        category: 'General',
        publicUrl: `/forms/${hash}/form/taskCard/${form.id}`
      })),
      
      // NEW INSPECTION FORMS
      ...vehicleInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Vehicle Inspection',
        formType: 'vehicleInspection',
        category: 'Inspection',
        publicUrl: `/forms/${hash}/form/vehicleInspection/${form.id}`
      })),
      ...ewpInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'EWP Inspection',
        formType: 'ewpInspection',
        category: 'Inspection',
        publicUrl: `/forms/${hash}/form/ewpInspection/${form.id}`
      })),
      ...telehandlerInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Telehandler Inspection',
        formType: 'telehandlerInspection',
        category: 'Inspection',
        publicUrl: `/forms/${hash}/form/telehandlerInspection/${form.id}`
      })),
      ...employeeChecklistForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Employee Checklist',
        formType: 'employeeChecklist',
        category: 'Inspection',
        publicUrl: `/forms/${hash}/form/employeeChecklist/${form.id}`
      })),
      ...siteManagerInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Site Manager Inspection',
        formType: 'siteManagerInspection',
        category: 'Inspection',
        publicUrl: `/forms/${hash}/form/siteManagerInspection/${form.id}`
      })),
      ...detailedInspectionReportForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Detailed Inspection Report',
        formType: 'detailedInspectionReport',
        category: 'Inspection',
        publicUrl: `/forms/${hash}/form/detailedInspectionReport/${form.id}`
      }))
    ];

    res.json({
      success: true,
      company: fullCompany,
      forms: activeForms,
      hash: hash,
      stats: {
        total: activeForms.length,
        byCategory: {
          general: activeForms.filter(form => form.category === 'General').length,
          inspection: activeForms.filter(form => form.category === 'Inspection').length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching public forms:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch company forms'
    });
  }
});

module.exports = router;