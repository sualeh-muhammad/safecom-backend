// const express = require('express');
// const { PrismaClient } = require('@prisma/client');
// const { authMiddleware, requireRole } = require('../middleware/auth');

// const router = express.Router();
// const prisma = new PrismaClient();

// // Apply auth middleware to all routes
// router.use(authMiddleware);

// // EXISTING SUBMISSION ROUTES

// // Get Site Sign-In submissions
// router.get('/site-sign-in-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     // Verify form belongs to company
//     const form = await prisma.siteSignInForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     // Get submissions for this form
//     const submissions = await prisma.siteSignInSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching site sign-in submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Site Induction submissions
// router.get('/site-induction-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     // Verify form belongs to company
//     const form = await prisma.siteInductionForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     // Get submissions for this form
//     const submissions = await prisma.siteInductionSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching site induction submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Safety Check submissions
// router.get('/safety-check-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     // Verify form belongs to company
//     const form = await prisma.safetyCheckForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     // Get submissions for this form
//     const submissions = await prisma.safetyCheckSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching safety check submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Incident Report submissions
// router.get('/incident-report-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     // Verify form belongs to company
//     const form = await prisma.incidentReportForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     // Get submissions for this form
//     const submissions = await prisma.incidentReportSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching incident report submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Daily Report submissions
// router.get('/daily-report-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     // Verify form belongs to company
//     const form = await prisma.dailyReportForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     // Get submissions for this form
//     const submissions = await prisma.dailyReportSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching daily report submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // NEW GENERAL FORM SUBMISSION ROUTES

// // Get Psychosocial Hazard submissions
// router.get('/psychosocial-hazard-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.psychosocialHazardForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.psychosocialHazardSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching psychosocial hazard submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Company Induction submissions
// router.get('/company-induction-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.companyInductionForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.companyInductionSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching company induction submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Pre Start Staff submissions
// router.get('/pre-start-staff-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.preStartStaffForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.preStartStaffSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching pre start staff submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Daily Pre Start Contractor submissions
// router.get('/daily-pre-start-contractor-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.dailyPreStartContractorForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.dailyPreStartContractorSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching daily pre start contractor submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Toolbox Meeting submissions
// router.get('/toolbox-meeting-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.toolboxMeetingForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.toolboxMeetingSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching toolbox meeting submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Hazard Risk Assessment submissions
// router.get('/hazard-risk-assessment-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.hazardRiskAssessmentForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.hazardRiskAssessmentSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching hazard risk assessment submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Hazard Report submissions
// router.get('/hazard-report-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.hazardReportForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.hazardReportSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching hazard report submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get SWMS Inspection submissions
// router.get('/swms-inspection-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.swmsInspectionForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.swmsInspectionSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching SWMS inspection submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Director Worksite Checklist submissions
// router.get('/director-worksite-checklist-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.directorWorksiteChecklistForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.directorWorksiteChecklistSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching director worksite checklist submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Task Card submissions
// router.get('/task-card-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.taskCardForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.taskCardSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching task card submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // NEW INSPECTION FORM SUBMISSION ROUTES

// // Get Vehicle Inspection submissions
// router.get('/vehicle-inspection-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.vehicleInspectionForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.vehicleInspectionSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching vehicle inspection submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get EWP Inspection submissions
// router.get('/ewp-inspection-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.ewpInspectionForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.ewpInspectionSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching EWP inspection submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Telehandler Inspection submissions
// router.get('/telehandler-inspection-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.telehandlerInspectionForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.telehandlerInspectionSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching telehandler inspection submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Employee Checklist submissions
// router.get('/employee-checklist-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.employeeChecklistForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.employeeChecklistSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching employee checklist submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Site Manager Inspection submissions
// router.get('/site-manager-inspection-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.siteManagerInspectionForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.siteManagerInspectionSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching site manager inspection submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // Get Detailed Inspection Report submissions
// router.get('/detailed-inspection-report-submissions', async (req, res) => {
//   try {
//     const { formId } = req.query;
//     const { companyId } = req.user;

//     if (!formId) {
//       return res.status(400).json({
//         error: 'Form ID required',
//         message: 'formId query parameter is required'
//       });
//     }

//     const form = await prisma.detailedInspectionReportForm.findFirst({
//       where: { id: formId, companyId }
//     });

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to access it'
//       });
//     }

//     const submissions = await prisma.detailedInspectionReportSubmission.findMany({
//       where: { formId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true
//           }
//         }
//       },
//       orderBy: { submittedAt: 'desc' }
//     });

//     res.json({
//       success: true,
//       submissions: submissions,
//       total: submissions.length,
//       formName: form.formName
//     });

//   } catch (error) {
//     console.error('Error fetching detailed inspection report submissions:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submissions'
//     });
//   }
// });

// // UPDATED GENERIC SUBMISSION ENDPOINTS

// // Get single submission details (generic endpoint for all form types)
// router.get('/submission/:submissionId', async (req, res) => {
//   try {
//     const { submissionId } = req.params;
//     const { formType } = req.query;
//     const { companyId } = req.user;

//     if (!formType) {
//       return res.status(400).json({
//         error: 'Form type required',
//         message: 'formType query parameter is required'
//       });
//     }

//     let submission;

//     // Get submission based on form type
//     switch (formType) {
//       // EXISTING FORMS
//       case 'siteSignIn':
//         submission = await prisma.siteSignInSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 firstName: true,
//                 lastName: true,
//                 email: true,
//                 phone: true
//               }
//             },
//             form: {
//               select: {
//                 id: true,
//                 formName: true,
//                 description: true
//               }
//             },
//             jobSite: {
//               select: {
//                 id: true,
//                 jobsiteName: true,
//                 streetAddress: true,
//                 city: true,
//                 state: true
//               }
//             }
//           }
//         });
//         break;

//       case 'siteInduction':
//         submission = await prisma.siteInductionSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'safetyCheck':
//         submission = await prisma.safetyCheckSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'incidentReport':
//         submission = await prisma.incidentReportSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'dailyReport':
//         submission = await prisma.dailyReportSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       // NEW GENERAL FORMS
//       case 'psychosocialHazard':
//         submission = await prisma.psychosocialHazardSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'companyInduction':
//         submission = await prisma.companyInductionSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'preStartStaff':
//         submission = await prisma.preStartStaffSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'dailyPreStartContractor':
//         submission = await prisma.dailyPreStartContractorSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'toolboxMeeting':
//         submission = await prisma.toolboxMeetingSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'hazardRiskAssessment':
//         submission = await prisma.hazardRiskAssessmentSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'hazardReport':
//         submission = await prisma.hazardReportSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'swmsInspection':
//         submission = await prisma.swmsInspectionSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'directorWorksiteChecklist':
//         submission = await prisma.directorWorksiteChecklistSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'taskCard':
//         submission = await prisma.taskCardSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       // NEW INSPECTION FORMS
//       case 'vehicleInspection':
//         submission = await prisma.vehicleInspectionSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'ewpInspection':
//         submission = await prisma.ewpInspectionSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'telehandlerInspection':
//         submission = await prisma.telehandlerInspectionSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'employeeChecklist':
//         submission = await prisma.employeeChecklistSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'siteManagerInspection':
//         submission = await prisma.siteManagerInspectionSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       case 'detailedInspectionReport':
//         submission = await prisma.detailedInspectionReportSubmission.findFirst({
//           where: { id: submissionId, companyId },
//           include: {
//             user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
//             form: { select: { id: true, formName: true, description: true } },
//             jobSite: { select: { id: true, jobsiteName: true, streetAddress: true, city: true, state: true } }
//           }
//         });
//         break;

//       default:
//         return res.status(400).json({
//           error: 'Invalid form type',
//           message: 'Unsupported form type'
//         });
//     }

//     if (!submission) {
//       return res.status(404).json({
//         error: 'Submission not found',
//         message: 'Submission not found or you do not have permission to access it'
//       });
//     }

//     res.json({
//       success: true,
//       submission: submission,
//       formType: formType
//     });

//   } catch (error) {
//     console.error('Error fetching submission:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submission'
//     });
//   }
// });

// // Get submission statistics for a form (updated with all form types)
// router.get('/submission-stats/:formId', async (req, res) => {
//   try {
//     const { formId } = req.params;
//     const { formType } = req.query;
//     const { companyId } = req.user;

//     if (!formType) {
//       return res.status(400).json({
//         error: 'Form type required',
//         message: 'formType query parameter is required'
//       });
//     }

//     let submissions = [];

//     // Get submissions based on form type
//     switch (formType) {
//       // EXISTING FORMS
//       case 'siteSignIn':
//         submissions = await prisma.siteSignInSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'siteInduction':
//         submissions = await prisma.siteInductionSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'safetyCheck':
//         submissions = await prisma.safetyCheckSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'incidentReport':
//         submissions = await prisma.incidentReportSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'dailyReport':
//         submissions = await prisma.dailyReportSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;

//       // NEW GENERAL FORMS
//       case 'psychosocialHazard':
//         submissions = await prisma.psychosocialHazardSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'companyInduction':
//         submissions = await prisma.companyInductionSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'preStartStaff':
//         submissions = await prisma.preStartStaffSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'dailyPreStartContractor':
//         submissions = await prisma.dailyPreStartContractorSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'toolboxMeeting':
//         submissions = await prisma.toolboxMeetingSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'hazardRiskAssessment':
//         submissions = await prisma.hazardRiskAssessmentSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'hazardReport':
//         submissions = await prisma.hazardReportSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'swmsInspection':
//         submissions = await prisma.swmsInspectionSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'directorWorksiteChecklist':
//         submissions = await prisma.directorWorksiteChecklistSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'taskCard':
//         submissions = await prisma.taskCardSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;

//       // NEW INSPECTION FORMS
//       case 'vehicleInspection':
//         submissions = await prisma.vehicleInspectionSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'ewpInspection':
//         submissions = await prisma.ewpInspectionSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'telehandlerInspection':
//         submissions = await prisma.telehandlerInspectionSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'employeeChecklist':
//         submissions = await prisma.employeeChecklistSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'siteManagerInspection':
//         submissions = await prisma.siteManagerInspectionSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;
//       case 'detailedInspectionReport':
//         submissions = await prisma.detailedInspectionReportSubmission.findMany({
//           where: { formId, companyId },
//           select: { id: true, submittedAt: true, userId: true }
//         });
//         break;

//       default:
//         return res.status(400).json({
//           error: 'Invalid form type'
//         });
//     }

//     // Calculate statistics
//     const totalSubmissions = submissions.length;
//     const uniqueUsers = new Set(submissions.map(s => s.userId)).size;
//     const uniqueDays = new Set(
//       submissions.map(s => new Date(s.submittedAt).toDateString())
//     ).size;

//     // Get submissions by day (last 30 days)
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//     const recentSubmissions = submissions.filter(
//       s => new Date(s.submittedAt) >= thirtyDaysAgo
//     );

//     const submissionsByDay = {};
//     recentSubmissions.forEach(submission => {
//       const day = new Date(submission.submittedAt).toDateString();
//       submissionsByDay[day] = (submissionsByDay[day] || 0) + 1;
//     });

//     res.json({
//       success: true,
//       stats: {
//         totalSubmissions,
//         uniqueUsers,
//         uniqueDays,
//         recentSubmissions: recentSubmissions.length,
//         submissionsByDay
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching submission stats:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch submission statistics'
//     });
//   }
// });

// module.exports = router;


// routes/submission.js - Fixed route structure to match frontend expectations
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Form type to table mappings
const FORM_TYPE_MAPPINGS = {
  // EXISTING FORMS
  siteSignIn: {
    formTable: 'siteSignInForm',
    submissionTable: 'siteSignInSubmission',
    endpoint: 'site-sign-in-submissions'
  },
  siteInduction: {
    formTable: 'siteInductionForm',
    submissionTable: 'siteInductionSubmission',
    endpoint: 'site-induction-submissions'
  },
  safetyCheck: {
    formTable: 'safetyCheckForm',
    submissionTable: 'safetyCheckSubmission',
    endpoint: 'safety-check-submissions'
  },
  incidentReport: {
    formTable: 'incidentReportForm',
    submissionTable: 'incidentReportSubmission',
    endpoint: 'incident-report-submissions'
  },
  dailyReport: {
    formTable: 'dailyReportForm',
    submissionTable: 'dailyReportSubmission',
    endpoint: 'daily-report-submissions'
  },
  
  // NEW GENERAL FORMS
  psychosocialHazard: {
    formTable: 'psychosocialHazardForm',
    submissionTable: 'psychosocialHazardSubmission',
    endpoint: 'psychosocial-hazard-submissions'
  },
  companyInduction: {
    formTable: 'companyInductionForm',
    submissionTable: 'companyInductionSubmission',
    endpoint: 'company-induction-submissions'
  },
  preStartStaff: {
    formTable: 'preStartStaffForm',
    submissionTable: 'preStartStaffSubmission',
    endpoint: 'pre-start-staff-submissions'
  },
  dailyPreStartContractor: {
    formTable: 'dailyPreStartContractorForm',
    submissionTable: 'dailyPreStartContractorSubmission',
    endpoint: 'daily-pre-start-contractor-submissions'
  },
  toolboxMeeting: {
    formTable: 'toolboxMeetingForm',
    submissionTable: 'toolboxMeetingSubmission',
    endpoint: 'toolbox-meeting-submissions'
  },
  hazardRiskAssessment: {
    formTable: 'hazardRiskAssessmentForm',
    submissionTable: 'hazardRiskAssessmentSubmission',
    endpoint: 'hazard-risk-assessment-submissions'
  },
  hazardReport: {
    formTable: 'hazardReportForm',
    submissionTable: 'hazardReportSubmission',
    endpoint: 'hazard-report-submissions'
  },
  swmsInspection: {
    formTable: 'swmsInspectionForm',
    submissionTable: 'swmsInspectionSubmission',
    endpoint: 'swms-inspection-submissions'
  },
  directorWorksiteChecklist: {
    formTable: 'directorWorksiteChecklistForm',
    submissionTable: 'directorWorksiteChecklistSubmission',
    endpoint: 'director-worksite-checklist-submissions'
  },
  taskCard: {
    formTable: 'taskCardForm',
    submissionTable: 'taskCardSubmission',
    endpoint: 'task-card-submissions'
  },
  
  // NEW INSPECTION FORMS
  vehicleInspection: {
    formTable: 'vehicleInspectionForm',
    submissionTable: 'vehicleInspectionSubmission',
    endpoint: 'vehicle-inspection-submissions'
  },
  ewpInspection: {
    formTable: 'ewpInspectionForm',
    submissionTable: 'ewpInspectionSubmission',
    endpoint: 'ewp-inspection-submissions'
  },
  telehandlerInspection: {
    formTable: 'telehandlerInspectionForm',
    submissionTable: 'telehandlerInspectionSubmission',
    endpoint: 'telehandler-inspection-submissions'
  },
  employeeChecklist: {
    formTable: 'employeeChecklistForm',
    submissionTable: 'employeeChecklistSubmission',
    endpoint: 'employee-checklist-submissions'
  },
  siteManagerInspection: {
    formTable: 'siteManagerInspectionForm',
    submissionTable: 'siteManagerInspectionSubmission',
    endpoint: 'site-manager-inspection-submissions'
  },
  detailedInspectionReport: {
    formTable: 'detailedInspectionReportForm',
    submissionTable: 'detailedInspectionReportSubmission',
    endpoint: 'detailed-inspection-report-submissions'
  }
};

// Reverse mapping: endpoint to form type
const ENDPOINT_TO_FORM_TYPE = {};
Object.entries(FORM_TYPE_MAPPINGS).forEach(([formType, mapping]) => {
  ENDPOINT_TO_FORM_TYPE[mapping.endpoint] = formType;
});

// Helper function to get table names for a form type
const getTableNames = (formType) => {
  const mapping = FORM_TYPE_MAPPINGS[formType];
  if (!mapping) {
    throw new Error(`Unsupported form type: ${formType}`);
  }
  return mapping;
};

// Helper function to get dynamic includes based on form type
const getSubmissionIncludes = (formType) => {
  const baseIncludes = {
    form: {
      select: { formName: true, description: true }
    },
    user: {
      select: { firstName: true, lastName: true, email: true, role: true }
    },
    company: {
      select: { name: true }
    }
  };

  // Add form-specific includes
  switch (formType) {
    case 'siteSignIn':
    case 'preStartStaff':
      return {
        ...baseIncludes,
        jobSite: {
          select: { jobsiteName: true, city: true, state: true }
        }
      };
    default:
      return baseIncludes;
  }
};

// ================================
// DYNAMIC ROUTES FOR ALL FORM TYPES
// ================================

// Create routes for each form type dynamically
Object.entries(FORM_TYPE_MAPPINGS).forEach(([formType, mapping]) => {
  const endpoint = mapping.endpoint;
  const submissionTable = mapping.submissionTable;
  const formTable = mapping.formTable;

  // GET /api/submission/{endpoint} - Get submissions for specific form type
  router.get(`/${endpoint}`, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
      const { companyId } = req.user;
      const { 
        formId,
        page = 1, 
        limit = 50, 
        status, 
        startDate, 
        endDate,
        sortBy = 'submittedAt',
        sortOrder = 'desc'
      } = req.query;

      console.log(`📋 Fetching ${formType} submissions for form: ${formId}`);

      // If formId is provided, verify form exists and belongs to company
      if (formId) {
        const formExists = await prisma[formTable].findFirst({
          where: { id: formId, companyId }
        });

        if (!formExists) {
          return res.status(404).json({
            error: 'Form not found',
            message: 'The requested form does not exist or you do not have access to it'
          });
        }
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      let where = { companyId };
      
      if (formId) {
        where.formId = formId;
      }

      // Add status filter if provided
      if (status) {
        where.status = status;
      }

      // Add date range filter if provided
      if (startDate && endDate) {
        // Try different date fields based on form type
        const dateField = formType === 'siteSignIn' ? 'signInTime' : 
                         formType === 'incidentReport' ? 'incidentDate' : 
                         'submittedAt';
        
        where[dateField] = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      // Get submissions with pagination
      const [submissions, total] = await Promise.all([
        prisma[submissionTable].findMany({
          where,
          include: getSubmissionIncludes(formType),
          orderBy: { [sortBy]: sortOrder },
          skip: offset,
          take: parseInt(limit)
        }),
        prisma[submissionTable].count({ where })
      ]);

      console.log(`✅ Found ${submissions.length} ${formType} submissions out of ${total} total`);

      res.json({
        success: true,
        data: submissions,
        submissions: submissions, // For compatibility with existing frontend
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        formType,
        formId
      });

    } catch (error) {
      console.error(`Error fetching ${formType} submissions:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: `Failed to fetch ${formType} submissions`
      });
    }
  });

  // GET /api/submission/{endpoint}/submission/:submissionId - Get specific submission
  router.get(`/${endpoint}/submission/:submissionId`, async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { companyId } = req.user;

      console.log(`🔍 Fetching ${formType} submission: ${submissionId}`);

      // Get submission with all related data
      const submission = await prisma[submissionTable].findFirst({
        where: {
          id: submissionId,
          companyId
        },
        include: getSubmissionIncludes(formType)
      });

      if (!submission) {
        return res.status(404).json({
          error: 'Submission not found',
          message: 'The requested submission does not exist or you do not have access to it'
        });
      }

      console.log(`✅ Found ${formType} submission`);

      res.json({
        success: true,
        data: submission,
        formType
      });

    } catch (error) {
      console.error(`Error fetching ${formType} submission:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: `Failed to fetch ${formType} submission`
      });
    }
  });

  // PUT /api/submission/{endpoint}/submission/:submissionId - Update submission
  router.put(`/${endpoint}/submission/:submissionId`, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { companyId } = req.user;
      const updateData = req.body;

      console.log(`📝 Updating ${formType} submission: ${submissionId}`);

      // Check if submission exists and belongs to company
      const existingSubmission = await prisma[submissionTable].findFirst({
        where: {
          id: submissionId,
          companyId
        }
      });

      if (!existingSubmission) {
        return res.status(404).json({
          error: 'Submission not found',
          message: 'The requested submission does not exist or you do not have access to it'
        });
      }

      // Update submission
      const updatedSubmission = await prisma[submissionTable].update({
        where: { id: submissionId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: getSubmissionIncludes(formType)
      });

      console.log(`✅ Updated ${formType} submission successfully`);

      res.json({
        success: true,
        message: 'Submission updated successfully',
        data: updatedSubmission
      });

    } catch (error) {
      console.error(`Error updating ${formType} submission:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: `Failed to update ${formType} submission`
      });
    }
  });

  // DELETE /api/submission/{endpoint}/submission/:submissionId - Delete submission
  router.delete(`/${endpoint}/submission/:submissionId`, requireRole(['ADMIN']), async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { companyId } = req.user;

      console.log(`🗑️ Deleting ${formType} submission: ${submissionId}`);

      // Check if submission exists and belongs to company
      const existingSubmission = await prisma[submissionTable].findFirst({
        where: {
          id: submissionId,
          companyId
        }
      });

      if (!existingSubmission) {
        return res.status(404).json({
          error: 'Submission not found',
          message: 'The requested submission does not exist or you do not have access to it'
        });
      }

      // Delete submission
      await prisma[submissionTable].delete({
        where: { id: submissionId }
      });

      // Update form submission count
      await prisma[formTable].update({
        where: { id: existingSubmission.formId },
        data: {
          submissionCount: { decrement: 1 }
        }
      });

      console.log(`✅ Deleted ${formType} submission successfully`);

      res.json({
        success: true,
        message: 'Submission deleted successfully'
      });

    } catch (error) {
      console.error(`Error deleting ${formType} submission:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: `Failed to delete ${formType} submission`
      });
    }
  });

  // GET /api/submission/{endpoint}/stats - Get submission statistics
  router.get(`/${endpoint}/stats`, requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
      const { companyId } = req.user;
      const { formId } = req.query;

      console.log(`📊 Fetching stats for ${formType} ${formId ? `form: ${formId}` : 'all forms'}`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Build base where clause
      let baseWhere = { companyId };
      if (formId) {
        baseWhere.formId = formId;
      }

      // Get various statistics
      const [
        totalSubmissions,
        todaySubmissions,
        weekSubmissions,
        monthSubmissions,
        completedSubmissions,
        pendingSubmissions
      ] = await Promise.all([
        // Total submissions
        prisma[submissionTable].count({
          where: baseWhere
        }),
        // Today's submissions
        prisma[submissionTable].count({
          where: {
            ...baseWhere,
            submittedAt: { gte: today }
          }
        }),
        // Last 7 days
        prisma[submissionTable].count({
          where: {
            ...baseWhere,
            submittedAt: { gte: sevenDaysAgo }
          }
        }),
        // Last 30 days
        prisma[submissionTable].count({
          where: {
            ...baseWhere,
            submittedAt: { gte: thirtyDaysAgo }
          }
        }),
        // Completed submissions (status varies by form type)
        prisma[submissionTable].count({
          where: {
            ...baseWhere,
            OR: [
              { status: 'COMPLETED' },
              { status: 'completed' },
              { status: 'ACTIVE' }, // For site sign-in
              { status: 'REVIEWED' }
            ]
          }
        }),
        // Pending submissions
        prisma[submissionTable].count({
          where: {
            ...baseWhere,
            OR: [
              { status: 'PENDING' },
              { status: 'pending' },
              { status: 'DRAFT' },
              { status: 'UNDER_INVESTIGATION' }
            ]
          }
        })
      ]);

      const stats = {
        total: totalSubmissions,
        today: todaySubmissions,
        lastWeek: weekSubmissions,
        lastMonth: monthSubmissions,
        completed: completedSubmissions,
        pending: pendingSubmissions,
        completionRate: totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0
      };

      console.log(`✅ Generated stats for ${formType}:`, stats);

      res.json({
        success: true,
        data: stats,
        formType,
        formId
      });

    } catch (error) {
      console.error(`Error fetching ${formType} submission stats:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: `Failed to fetch ${formType} submission statistics`
      });
    }
  });
});

// ================================
// UTILITY ROUTES
// ================================

// GET /api/submission/types - Get all supported form types
router.get('/types', (req, res) => {
  const supportedTypes = Object.entries(FORM_TYPE_MAPPINGS).map(([formType, mapping]) => ({
    formType,
    endpoint: mapping.endpoint,
    displayName: formType.replace(/([A-Z])/g, ' $1').trim(),
    tables: {
      formTable: mapping.formTable,
      submissionTable: mapping.submissionTable
    }
  }));

  res.json({
    success: true,
    data: supportedTypes
  });
});

// GET /api/submission/health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Submission routes are healthy',
    supportedEndpoints: Object.values(FORM_TYPE_MAPPINGS).map(m => m.endpoint),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;