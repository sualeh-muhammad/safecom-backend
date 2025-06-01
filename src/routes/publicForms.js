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
      ...siteSignInForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Site Sign-In",
        formType: "siteSignIn",
        category: "General",
        publicUrl: `/forms/${form.id}/sign-in`,
      })),
      ...siteInductionForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Site Induction",
        formType: "siteInduction",
        category: "General",
        publicUrl: `/forms/${form.id}/site-induction`, // Note: This route doesn't exist in your routes
      })),
      ...safetyCheckForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Safety Check",
        formType: "safetyCheck",
        category: "General",
        publicUrl: `/forms/${form.id}/safety-check`, // Note: This route doesn't exist in your routes
      })),
      ...incidentReportForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Incident Report",
        formType: "incidentReport",
        category: "General",
        publicUrl: `/forms/${form.id}/incident-injury-report`,
      })),
      ...dailyReportForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Daily Report",
        formType: "dailyReport",
        category: "General",
        publicUrl: `/forms/${form.id}/daily-report`, // Note: This route doesn't exist in your routes
      })),

      // NEW GENERAL FORMS
      ...psychosocialHazardForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Psychosocial Hazards",
        formType: "psychosocialHazard",
        category: "General",
        publicUrl: `/forms/${form.id}/report-psychosocial-hazards`,
      })),
      ...companyInductionForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Company Induction",
        formType: "companyInduction",
        category: "General",
        publicUrl: `/forms/${form.id}/company-induction`, // Note: This route doesn't exist in your routes
      })),
      ...preStartStaffForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Pre Start Staff",
        formType: "preStartStaff",
        category: "General",
        publicUrl: `/forms/${form.id}/pre-start-company-staff`,
      })),
      ...dailyPreStartContractorForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Daily Pre Start Contractors",
        formType: "dailyPreStartContractor",
        category: "General",
        publicUrl: `/forms/${form.id}/pre-start-contractor`,
      })),
      ...toolboxMeetingForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Toolbox Meeting",
        formType: "toolboxMeeting",
        category: "General",
        publicUrl: `/forms/${form.id}/toolbox-meeting-checklist`,
      })),
      ...hazardRiskAssessmentForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Hazard Risk Assessment",
        formType: "hazardRiskAssessment",
        category: "General",
        publicUrl: `/forms/${form.id}/hazard-risk-assessment`,
      })),
      ...hazardReportForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Hazard Report",
        formType: "hazardReport",
        category: "General",
        publicUrl: `/forms/${form.id}/hazard-report-form`,
      })),
      ...swmsInspectionForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "SWMS Inspection",
        formType: "swmsInspection",
        category: "General",
        publicUrl: `/forms/${form.id}/spot-swms-inspection`,
      })),
      ...directorWorksiteChecklistForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Director Worksite Checklist",
        formType: "directorWorksiteChecklist",
        category: "General",
        publicUrl: `/forms/${form.id}/director-worker-checklist`,
      })),
      ...taskCardForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Task Card",
        formType: "taskCard",
        category: "General",
        publicUrl: `/forms/${form.id}/task-card`,
      })),

      // NEW INSPECTION FORMS
      ...vehicleInspectionForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Vehicle Inspection",
        formType: "vehicleInspection",
        category: "Inspection",
        publicUrl: `/forms/${form.id}/vehicle-inspection-checklist`,
      })),
      ...ewpInspectionForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "EWP Inspection",
        formType: "ewpInspection",
        category: "Inspection",
        publicUrl: `/forms/${form.id}/ewp-inspection`,
      })),
      ...telehandlerInspectionForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Telehandler Inspection",
        formType: "telehandlerInspection",
        category: "Inspection",
        publicUrl: `/forms/${form.id}/telehandler-daily-inspection-checklist`,
      })),
      ...employeeChecklistForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Employee Checklist",
        formType: "employeeChecklist",
        category: "Inspection",
        publicUrl: `/forms/${form.id}/employee-subcontractor-checklist`,
      })),
      ...siteManagerInspectionForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Site Manager Inspection",
        formType: "siteManagerInspection",
        category: "Inspection",
        publicUrl: `/forms/${form.id}/quick-site-manager-inspection`,
      })),
      ...detailedInspectionReportForms.map((form) => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: "Detailed Inspection Report",
        formType: "detailedInspectionReport",
        category: "Inspection",
        publicUrl: `/forms/${form.id}/detailed-inspection-report`, // Note: This route doesn't exist in your routes
      })),
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
