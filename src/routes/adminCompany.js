// routes/adminCompany.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { createHash, verifyHash, generatePublicUrl } = require('../utils/hashUtils');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get company hash for QR code generation
router.get('/company/hash', async (req, res) => {
  try {
    const { companyId } = req.user;

    if (!companyId) {
      return res.status(400).json({
        error: 'Company ID required',
        message: 'User must be associated with a company'
      });
    }

    // Verify company exists and is active
    const company = await prisma.company.findUnique({
      where: { 
        id: companyId,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        logoImageUrl: true,
        website: true,
        phone: true,
        email: true,
        isActive: true
      }
    });

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: 'Company not found or not active'
      });
    }

    // Generate secure hash
    const hash = createHash(companyId);
    const publicUrl = generatePublicUrl(companyId);

    console.log(`✅ Generated hash for company ${company.name}: ${hash}`);

    res.json({
      success: true,
      hash: hash,
      publicUrl: publicUrl,
      company: company,
      message: 'Secure hash generated successfully'
    });

  } catch (error) {
    console.error('Error generating company hash:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate company hash'
    });
  }
});

// Validate hash (for testing purposes - admin only)
router.post('/company/validate-hash', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { hash } = req.body;
    const { companyId } = req.user;

    if (!hash) {
      return res.status(400).json({
        error: 'Hash required',
        message: 'Hash parameter is required'
      });
    }

    const isValid = verifyHash(hash, companyId);

    res.json({
      success: true,
      isValid: isValid,
      hash: hash,
      companyId: companyId,
      message: isValid ? 'Hash is valid' : 'Hash is invalid'
    });

  } catch (error) {
    console.error('Error validating hash:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to validate hash'
    });
  }
});

// Get public forms count for company (admin view)
router.get('/company/public-forms-stats', async (req, res) => {
  try {
    const { companyId } = req.user;

    // Get count of active forms
    const [
      siteSignInCount,
      siteInductionCount,
      safetyCheckCount,
      incidentReportCount,
      dailyReportCount,
      psychosocialHazardCount,
      companyInductionCount,
      preStartStaffCount,
      dailyPreStartContractorCount,
      toolboxMeetingCount,
      hazardRiskAssessmentCount,
      hazardReportCount,
      swmsInspectionCount,
      directorWorksiteChecklistCount,
      taskCardCount,
      vehicleInspectionCount,
      ewpInspectionCount,
      telehandlerInspectionCount,
      employeeChecklistCount,
      siteManagerInspectionCount,
      detailedInspectionReportCount
    ] = await Promise.all([
      prisma.siteSignInForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.siteInductionForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.safetyCheckForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.incidentReportForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.dailyReportForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.psychosocialHazardForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.companyInductionForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.preStartStaffForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.dailyPreStartContractorForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.toolboxMeetingForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.hazardRiskAssessmentForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.hazardReportForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.swmsInspectionForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.directorWorksiteChecklistForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.taskCardForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.vehicleInspectionForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.ewpInspectionForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.telehandlerInspectionForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.employeeChecklistForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.siteManagerInspectionForm.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.detailedInspectionReportForm.count({ where: { companyId, status: 'ACTIVE' } })
    ]);

    const totalActiveForms = 
      siteSignInCount + siteInductionCount + safetyCheckCount + incidentReportCount + 
      dailyReportCount + psychosocialHazardCount + companyInductionCount + 
      preStartStaffCount + dailyPreStartContractorCount + toolboxMeetingCount + 
      hazardRiskAssessmentCount + hazardReportCount + swmsInspectionCount + 
      directorWorksiteChecklistCount + taskCardCount + vehicleInspectionCount + 
      ewpInspectionCount + telehandlerInspectionCount + employeeChecklistCount + 
      siteManagerInspectionCount + detailedInspectionReportCount;

    const generalFormsCount = 
      siteSignInCount + siteInductionCount + safetyCheckCount + incidentReportCount + 
      dailyReportCount + psychosocialHazardCount + companyInductionCount + 
      preStartStaffCount + dailyPreStartContractorCount + toolboxMeetingCount + 
      hazardRiskAssessmentCount + hazardReportCount + swmsInspectionCount + 
      directorWorksiteChecklistCount + taskCardCount;

    const inspectionFormsCount = 
      vehicleInspectionCount + ewpInspectionCount + telehandlerInspectionCount + 
      employeeChecklistCount + siteManagerInspectionCount + detailedInspectionReportCount;

    // Generate hash for the public URL
    const hash = createHash(companyId);
    const publicUrl = generatePublicUrl(companyId);

    res.json({
      success: true,
      stats: {
        totalActiveForms,
        generalForms: generalFormsCount,
        inspectionForms: inspectionFormsCount,
        breakdown: {
          // Existing forms
          siteSignIn: siteSignInCount,
          siteInduction: siteInductionCount,
          safetyCheck: safetyCheckCount,
          incidentReport: incidentReportCount,
          dailyReport: dailyReportCount,
          // New general forms
          psychosocialHazard: psychosocialHazardCount,
          companyInduction: companyInductionCount,
          preStartStaff: preStartStaffCount,
          dailyPreStartContractor: dailyPreStartContractorCount,
          toolboxMeeting: toolboxMeetingCount,
          hazardRiskAssessment: hazardRiskAssessmentCount,
          hazardReport: hazardReportCount,
          swmsInspection: swmsInspectionCount,
          directorWorksiteChecklist: directorWorksiteChecklistCount,
          taskCard: taskCardCount,
          // New inspection forms
          vehicleInspection: vehicleInspectionCount,
          ewpInspection: ewpInspectionCount,
          telehandlerInspection: telehandlerInspectionCount,
          employeeChecklist: employeeChecklistCount,
          siteManagerInspection: siteManagerInspectionCount,
          detailedInspectionReport: detailedInspectionReportCount
        }
      },
      hash: hash,
      publicUrl: publicUrl,
      message: 'Public forms statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching public forms stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch public forms statistics'
    });
  }
});

module.exports = router;