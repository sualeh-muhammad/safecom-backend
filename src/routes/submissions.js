const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(authMiddleware);

// EXISTING SUBMISSION ROUTES

// Get Site Sign-In submissions
router.get('/site-sign-in-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    // Verify form belongs to company
    const form = await prisma.siteSignInForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    // Get submissions for this form
    const submissions = await prisma.siteSignInSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching site sign-in submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Site Induction submissions
router.get('/site-induction-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    // Verify form belongs to company
    const form = await prisma.siteInductionForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    // Get submissions for this form
    const submissions = await prisma.siteInductionSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching site induction submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Safety Check submissions
router.get('/safety-check-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    // Verify form belongs to company
    const form = await prisma.safetyCheckForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    // Get submissions for this form
    const submissions = await prisma.safetyCheckSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching safety check submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Incident Report submissions
router.get('/incident-report-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    // Verify form belongs to company
    const form = await prisma.incidentReportForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    // Get submissions for this form
    const submissions = await prisma.incidentReportSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching incident report submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Daily Report submissions
router.get('/daily-report-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    // Verify form belongs to company
    const form = await prisma.dailyReportForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    // Get submissions for this form
    const submissions = await prisma.dailyReportSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching daily report submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// NEW GENERAL FORM SUBMISSION ROUTES

// Get Psychosocial Hazard submissions
router.get('/psychosocial-hazard-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.psychosocialHazardForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.psychosocialHazardSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching psychosocial hazard submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Company Induction submissions
router.get('/company-induction-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.companyInductionForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.companyInductionSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching company induction submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Pre Start Staff submissions
router.get('/pre-start-staff-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.preStartStaffForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.preStartStaffSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching pre start staff submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Daily Pre Start Contractor submissions
router.get('/daily-pre-start-contractor-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.dailyPreStartContractorForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.dailyPreStartContractorSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching daily pre start contractor submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Toolbox Meeting submissions
router.get('/toolbox-meeting-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.toolboxMeetingForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.toolboxMeetingSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching toolbox meeting submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Hazard Risk Assessment submissions
router.get('/hazard-risk-assessment-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.hazardRiskAssessmentForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.hazardRiskAssessmentSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching hazard risk assessment submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Hazard Report submissions
router.get('/hazard-report-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.hazardReportForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.hazardReportSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching hazard report submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get SWMS Inspection submissions
router.get('/swms-inspection-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.swmsInspectionForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.swmsInspectionSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching SWMS inspection submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Director Worksite Checklist submissions
router.get('/director-worksite-checklist-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.directorWorksiteChecklistForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.directorWorksiteChecklistSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching director worksite checklist submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Task Card submissions
router.get('/task-card-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.taskCardForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.taskCardSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching task card submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// NEW INSPECTION FORM SUBMISSION ROUTES

// Get Vehicle Inspection submissions
router.get('/vehicle-inspection-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.vehicleInspectionForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.vehicleInspectionSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching vehicle inspection submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get EWP Inspection submissions
router.get('/ewp-inspection-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.ewpInspectionForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.ewpInspectionSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching EWP inspection submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Telehandler Inspection submissions
router.get('/telehandler-inspection-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.telehandlerInspectionForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.telehandlerInspectionSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching telehandler inspection submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Employee Checklist submissions
router.get('/employee-checklist-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.employeeChecklistForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.employeeChecklistSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching employee checklist submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Site Manager Inspection submissions
router.get('/site-manager-inspection-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.siteManagerInspectionForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.siteManagerInspectionSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching site manager inspection submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get Detailed Inspection Report submissions
router.get('/detailed-inspection-report-submissions', async (req, res) => {
  try {
    const { formId } = req.query;
    const { companyId } = req.user;

    if (!formId) {
      return res.status(400).json({
        error: 'Form ID required',
        message: 'formId query parameter is required'
      });
    }

    const form = await prisma.detailedInspectionReportForm.findFirst({
      where: { id: formId, companyId }
    });

    if (!form) {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to access it'
      });
    }

    const submissions = await prisma.detailedInspectionReportSubmission.findMany({
      where: { formId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length,
      formName: form.formName
    });

  } catch (error) {
    console.error('Error fetching detailed inspection report submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// UPDATED GENERIC SUBMISSION ENDPOINTS

// Get single submission details (generic endpoint for all form types)
router.get('/submission/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { formType } = req.query;
    const { companyId } = req.user;

    if (!formType) {
      return res.status(400).json({
        error: 'Form type required',
        message: 'formType query parameter is required'
      });
    }

    let submission;

    // Get submission based on form type
    switch (formType) {
      // EXISTING FORMS
      case 'siteSignIn':
        submission = await prisma.siteSignInSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            form: {
              select: {
                id: true,
                formName: true,
                description: true
              }
            },
            jobSite: {
              select: {
                id: true,
                jobsiteName: true,
                streetAddress: true,
                city: true,
                state: true
              }
            }
          }
        });
        break;

      case 'siteInduction':
        submission = await prisma.siteInductionSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'safetyCheck':
        submission = await prisma.safetyCheckSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'incidentReport':
        submission = await prisma.incidentReportSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'dailyReport':
        submission = await prisma.dailyReportSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      // NEW GENERAL FORMS
      case 'psychosocialHazard':
        submission = await prisma.psychosocialHazardSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'companyInduction':
        submission = await prisma.companyInductionSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'preStartStaff':
        submission = await prisma.preStartStaffSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'dailyPreStartContractor':
        submission = await prisma.dailyPreStartContractorSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'toolboxMeeting':
        submission = await prisma.toolboxMeetingSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'hazardRiskAssessment':
        submission = await prisma.hazardRiskAssessmentSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'hazardReport':
        submission = await prisma.hazardReportSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'swmsInspection':
        submission = await prisma.swmsInspectionSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'directorWorksiteChecklist':
        submission = await prisma.directorWorksiteChecklistSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'taskCard':
        submission = await prisma.taskCardSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      // NEW INSPECTION FORMS
      case 'vehicleInspection':
        submission = await prisma.vehicleInspectionSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'ewpInspection':
        submission = await prisma.ewpInspectionSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'telehandlerInspection':
        submission = await prisma.telehandlerInspectionSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'employeeChecklist':
        submission = await prisma.employeeChecklistSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'siteManagerInspection':
        submission = await prisma.siteManagerInspectionSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      case 'detailedInspectionReport':
        submission = await prisma.detailedInspectionReportSubmission.findFirst({
          where: { id: submissionId, companyId },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            form: { select: { id: true, formName: true, description: true } },
            jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
          }
        });
        break;

      default:
        return res.status(400).json({
          error: 'Invalid form type',
          message: 'Unsupported form type'
        });
    }

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'Submission not found or you do not have permission to access it'
      });
    }

    res.json({
      success: true,
      submission: submission,
      formType: formType
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
});

// Get submission statistics for a form (updated with all form types)
router.get('/submission-stats/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const { formType } = req.query;
    const { companyId } = req.user;

    if (!formType) {
      return res.status(400).json({
        error: 'Form type required',
        message: 'formType query parameter is required'
      });
    }

    let submissions = [];

    // Get submissions based on form type
    switch (formType) {
      // EXISTING FORMS
      case 'siteSignIn':
        submissions = await prisma.siteSignInSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'siteInduction':
        submissions = await prisma.siteInductionSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'safetyCheck':
        submissions = await prisma.safetyCheckSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'incidentReport':
        submissions = await prisma.incidentReportSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'dailyReport':
        submissions = await prisma.dailyReportSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;

      // NEW GENERAL FORMS
      case 'psychosocialHazard':
        submissions = await prisma.psychosocialHazardSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'companyInduction':
        submissions = await prisma.companyInductionSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'preStartStaff':
        submissions = await prisma.preStartStaffSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'dailyPreStartContractor':
        submissions = await prisma.dailyPreStartContractorSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'toolboxMeeting':
        submissions = await prisma.toolboxMeetingSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'hazardRiskAssessment':
        submissions = await prisma.hazardRiskAssessmentSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'hazardReport':
        submissions = await prisma.hazardReportSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'swmsInspection':
        submissions = await prisma.swmsInspectionSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'directorWorksiteChecklist':
        submissions = await prisma.directorWorksiteChecklistSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'taskCard':
        submissions = await prisma.taskCardSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;

      // NEW INSPECTION FORMS
      case 'vehicleInspection':
        submissions = await prisma.vehicleInspectionSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'ewpInspection':
        submissions = await prisma.ewpInspectionSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'telehandlerInspection':
        submissions = await prisma.telehandlerInspectionSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'employeeChecklist':
        submissions = await prisma.employeeChecklistSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'siteManagerInspection':
        submissions = await prisma.siteManagerInspectionSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;
      case 'detailedInspectionReport':
        submissions = await prisma.detailedInspectionReportSubmission.findMany({
          where: { formId, companyId },
          select: { id: true, submittedAt: true, userId: true }
        });
        break;

      default:
        return res.status(400).json({
          error: 'Invalid form type'
        });
    }

    // Calculate statistics
    const totalSubmissions = submissions.length;
    const uniqueUsers = new Set(submissions.map(s => s.userId)).size;
    const uniqueDays = new Set(
      submissions.map(s => new Date(s.submittedAt).toDateString())
    ).size;

    // Get submissions by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubmissions = submissions.filter(
      s => new Date(s.submittedAt) >= thirtyDaysAgo
    );

    const submissionsByDay = {};
    recentSubmissions.forEach(submission => {
      const day = new Date(submission.submittedAt).toDateString();
      submissionsByDay[day] = (submissionsByDay[day] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalSubmissions,
        uniqueUsers,
        uniqueDays,
        recentSubmissions: recentSubmissions.length,
        submissionsByDay
      }
    });

  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submission statistics'
    });
  }
});

module.exports = router;