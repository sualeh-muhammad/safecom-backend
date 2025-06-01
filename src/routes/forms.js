const express = require('express');
const { PrismaClient } = require('@prisma/client');
// const QRCode = require('qrcode');
const {  requireRole  , authMiddleware} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware)

// router.get('/forms',  async (req, res) => {
//   try {
//     const { companyId } = req.user;

//     // Get all form types for the company
//     const [
//       siteSignInForms,
//       siteInductionForms,
//       safetyCheckForms,
//       incidentReportForms,
//       dailyReportForms
//     ] = await Promise.all([
//       prisma.siteSignInForm.findMany({
//         where: { companyId },
//         include: {
//           _count: {
//             select: { submissions: true }
//           }
//         }
//       }),
//       prisma.siteInductionForm.findMany({
//         where: { companyId },
//         include: {
//           _count: {
//             select: { submissions: true }
//           }
//         }
//       }),
//       prisma.safetyCheckForm.findMany({
//         where: { companyId },
//         include: {
//           _count: {
//             select: { submissions: true }
//           }
//         }
//       }),
//       prisma.incidentReportForm.findMany({
//         where: { companyId },
//         include: {
//           _count: {
//             select: { submissions: true }
//           }
//         }
//       }),
//       prisma.dailyReportForm.findMany({
//         where: { companyId },
//         include: {
//           _count: {
//             select: { submissions: true }
//           }
//         }
//       })
//     ]);

//     // Format all forms into a unified structure
//     const allForms = [
//       ...siteSignInForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Site Sign-In',
//         status: form.status,
//         submissions: form._count.submissions,
//         createdAt: form.createdAt,
//         updatedAt: form.updatedAt,
//         formType: 'siteSignIn'
//       })),
//       ...siteInductionForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Site Induction',
//         status: form.status,
//         submissions: form._count.submissions,
//         createdAt: form.createdAt,
//         updatedAt: form.updatedAt,
//         formType: 'siteInduction'
//       })),
//       ...safetyCheckForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Safety Check',
//         status: form.status,
//         submissions: form._count.submissions,
//         createdAt: form.createdAt,
//         updatedAt: form.updatedAt,
//         formType: 'safetyCheck'
//       })),
//       ...incidentReportForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Incident Report',
//         status: form.status,
//         submissions: form._count.submissions,
//         createdAt: form.createdAt,
//         updatedAt: form.updatedAt,
//         formType: 'incidentReport'
//       })),
//       ...dailyReportForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Daily Report',
//         status: form.status,
//         submissions: form._count.submissions,
//         createdAt: form.createdAt,
//         updatedAt: form.updatedAt,
//         formType: 'dailyReport'
//       }))
//     ];

//     // Sort by creation date (newest first)
//     allForms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//     res.json({
//       success: true,
//       forms: allForms
//     });

//   } catch (error) {
//     console.error('Error fetching forms:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch forms'
//     });
//   }
// });

// router.patch('/forms/:formId/status',  requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
//   try {
//     const { formId } = req.params;
//     const { status, formType } = req.body;
//     const { companyId } = req.user;

//     // Validate status
//     if (!['ACTIVE', 'INACTIVE', 'DRAFT'].includes(status)) {
//       return res.status(400).json({
//         error: 'Invalid status',
//         message: 'Status must be ACTIVE, INACTIVE, or DRAFT'
//       });
//     }

//     // Validate formType
//     const validFormTypes = ['siteSignIn', 'siteInduction', 'safetyCheck', 'incidentReport', 'dailyReport'];
//     if (!validFormTypes.includes(formType)) {
//       return res.status(400).json({
//         error: 'Invalid form type',
//         message: 'Form type must be one of: ' + validFormTypes.join(', ')
//       });
//     }

//     let updatedForm;

//     // Update the appropriate form table based on formType
//     switch (formType) {
//       case 'siteSignIn':
//         updatedForm = await prisma.siteSignInForm.update({
//           where: { 
//             id: formId,
//             companyId: companyId // Ensure company owns this form
//           },
//           data: { status }
//         });
//         break;
//       case 'siteInduction':
//         updatedForm = await prisma.siteInductionForm.update({
//           where: { 
//             id: formId,
//             companyId: companyId
//           },
//           data: { status }
//         });
//         break;
//       case 'safetyCheck':
//         updatedForm = await prisma.safetyCheckForm.update({
//           where: { 
//             id: formId,
//             companyId: companyId
//           },
//           data: { status }
//         });
//         break;
//       case 'incidentReport':
//         updatedForm = await prisma.incidentReportForm.update({
//           where: { 
//             id: formId,
//             companyId: companyId
//           },
//           data: { status }
//         });
//         break;
//       case 'dailyReport':
//         updatedForm = await prisma.dailyReportForm.update({
//           where: { 
//             id: formId,
//             companyId: companyId
//           },
//           data: { status }
//         });
//         break;
//     }

//     res.json({
//       success: true,
//       message: `Form status updated to ${status}`,
//       form: updatedForm
//     });

//   } catch (error) {
//     console.error('Error updating form status:', error);
    
//     if (error.code === 'P2025') {
//       return res.status(404).json({
//         error: 'Form not found',
//         message: 'Form not found or you do not have permission to update it'
//       });
//     }

//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to update form status'
//     });
//   }
// });


// router.get('/forms/:formId',  async (req, res) => {
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

//     let form;
//     switch (formType) {
//       case 'siteSignIn':
//         form = await prisma.siteSignInForm.findFirst({
//           where: { id: formId, companyId },
//           include: {
//             _count: { select: { submissions: true } }
//           }
//         });
//         break;
//       case 'siteInduction':
//         form = await prisma.siteInductionForm.findFirst({
//           where: { id: formId, companyId },
//           include: {
//             _count: { select: { submissions: true } }
//           }
//         });
//         break;
//       case 'safetyCheck':
//         form = await prisma.safetyCheckForm.findFirst({
//           where: { id: formId, companyId },
//           include: {
//             _count: { select: { submissions: true } }
//           }
//         });
//         break;
//       case 'incidentReport':
//         form = await prisma.incidentReportForm.findFirst({
//           where: { id: formId, companyId },
//           include: {
//             _count: { select: { submissions: true } }
//           }
//         });
//         break;
//       case 'dailyReport':
//         form = await prisma.dailyReportForm.findFirst({
//           where: { id: formId, companyId },
//           include: {
//             _count: { select: { submissions: true } }
//           }
//         });
//         break;
//       default:
//         return res.status(400).json({
//           error: 'Invalid form type'
//         });
//     }

//     if (!form) {
//       return res.status(404).json({
//         error: 'Form not found'
//       });
//     }

//     res.json({
//       success: true,
//       form: {
//         ...form,
//         submissions: form._count.submissions,
//         formType
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching form:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch form'
//     });
//   }
// });

// router.get('/public/:subdomain/forms', async (req, res) => {
//   try {
//     const { subdomain } = req.params;

//     // Find company by subdomain
//     const company = await prisma.company.findUnique({
//       where: { subdomain },
//       select: { id: true, name: true, subdomain: true }
//     });

//     if (!company) {
//       return res.status(404).json({
//         error: 'Company not found',
//         message: 'Invalid subdomain'
//       });
//     }

//     // Get only ACTIVE forms for the company
//     const [
//       siteSignInForms,
//       siteInductionForms,
//       safetyCheckForms,
//       incidentReportForms,
//       dailyReportForms
//     ] = await Promise.all([
//       prisma.siteSignInForm.findMany({
//         where: { companyId: company.id, status: 'ACTIVE' }
//       }),
//       prisma.siteInductionForm.findMany({
//         where: { companyId: company.id, status: 'ACTIVE' }
//       }),
//       prisma.safetyCheckForm.findMany({
//         where: { companyId: company.id, status: 'ACTIVE' }
//       }),
//       prisma.incidentReportForm.findMany({
//         where: { companyId: company.id, status: 'ACTIVE' }
//       }),
//       prisma.dailyReportForm.findMany({
//         where: { companyId: company.id, status: 'ACTIVE' }
//       })
//     ]);

//     // Format all ACTIVE forms into a unified structure
//     const activeForms = [
//       ...siteSignInForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Site Sign-In',
//         formType: 'siteSignIn',
//         publicUrl: `${process.env.FRONTEND_URL}/${subdomain}/forms/siteSignIn/${form.id}`
//       })),
//       ...siteInductionForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Site Induction',
//         formType: 'siteInduction',
//         publicUrl: `${process.env.FRONTEND_URL}/${subdomain}/forms/siteInduction/${form.id}`
//       })),
//       ...safetyCheckForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Safety Check',
//         formType: 'safetyCheck',
//         publicUrl: `${process.env.FRONTEND_URL}/${subdomain}/forms/safetyCheck/${form.id}`
//       })),
//       ...incidentReportForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Incident Report',
//         formType: 'incidentReport',
//         publicUrl: `${process.env.FRONTEND_URL}/${subdomain}/forms/incidentReport/${form.id}`
//       })),
//       ...dailyReportForms.map(form => ({
//         id: form.id,
//         formName: form.formName,
//         description: form.description,
//         type: 'Daily Report',
//         formType: 'dailyReport',
//         publicUrl: `${process.env.FRONTEND_URL}/${subdomain}/forms/dailyReport/${form.id}`
//       }))
//     ];

//     res.json({
//       success: true,
//       company: {
//         name: company.name,
//         subdomain: company.subdomain
//       },
//       forms: activeForms
//     });

//   } catch (error) {
//     console.error('Error fetching public forms:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to fetch public forms'
//     });
//   }
// });



// GET /forms - Get all forms for a company
router.get('/forms', async (req, res) => {
  try {
    const { companyId } = req.user;

    // Get all form types for the company
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
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.siteInductionForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.safetyCheckForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.incidentReportForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.dailyReportForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      
      // NEW GENERAL FORMS
      prisma.psychosocialHazardForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.companyInductionForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.preStartStaffForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.dailyPreStartContractorForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.toolboxMeetingForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.hazardRiskAssessmentForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.hazardReportForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.swmsInspectionForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.directorWorksiteChecklistForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.taskCardForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      
      // NEW INSPECTION FORMS
      prisma.vehicleInspectionForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.ewpInspectionForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.telehandlerInspectionForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.employeeChecklistForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.siteManagerInspectionForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      }),
      prisma.detailedInspectionReportForm.findMany({
        where: { companyId },
        include: { _count: { select: { submissions: true } } }
      })
    ]);

    // Format all forms into a unified structure
    const allForms = [
      // EXISTING FORMS
      ...siteSignInForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Site Sign-In',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'siteSignIn',
        category: 'General'
      })),
      ...siteInductionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Site Induction',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'siteInduction',
        category: 'General'
      })),
      ...safetyCheckForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Safety Check',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'safetyCheck',
        category: 'General'
      })),
      ...incidentReportForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Incident Report',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'incidentReport',
        category: 'General'
      })),
      ...dailyReportForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Daily Report',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'dailyReport',
        category: 'General'
      })),
      
      // NEW GENERAL FORMS
      ...psychosocialHazardForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Psychosocial Hazards',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'psychosocialHazard',
        category: 'General'
      })),
      ...companyInductionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Company Induction',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'companyInduction',
        category: 'General'
      })),
      ...preStartStaffForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Pre Start Staff',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'preStartStaff',
        category: 'General'
      })),
      ...dailyPreStartContractorForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Daily Pre Start Contractors',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'dailyPreStartContractor',
        category: 'General'
      })),
      ...toolboxMeetingForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Toolbox Meeting',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'toolboxMeeting',
        category: 'General'
      })),
      ...hazardRiskAssessmentForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Hazard Risk Assessment',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'hazardRiskAssessment',
        category: 'General'
      })),
      ...hazardReportForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Hazard Report',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'hazardReport',
        category: 'General'
      })),
      ...swmsInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'SWMS Inspection',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'swmsInspection',
        category: 'General'
      })),
      ...directorWorksiteChecklistForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Director Worksite Checklist',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'directorWorksiteChecklist',
        category: 'General'
      })),
      ...taskCardForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Task Card',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'taskCard',
        category: 'General'
      })),
      
      // NEW INSPECTION FORMS
      ...vehicleInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Vehicle Inspection',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'vehicleInspection',
        category: 'Inspection'
      })),
      ...ewpInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'EWP Inspection',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'ewpInspection',
        category: 'Inspection'
      })),
      ...telehandlerInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Telehandler Inspection',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'telehandlerInspection',
        category: 'Inspection'
      })),
      ...employeeChecklistForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Employee Checklist',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'employeeChecklist',
        category: 'Inspection'
      })),
      ...siteManagerInspectionForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Site Manager Inspection',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'siteManagerInspection',
        category: 'Inspection'
      })),
      ...detailedInspectionReportForms.map(form => ({
        id: form.id,
        formName: form.formName,
        description: form.description,
        type: 'Detailed Inspection Report',
        status: form.status,
        submissions: form._count.submissions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        formType: 'detailedInspectionReport',
        category: 'Inspection'
      }))
    ];

    // Sort by creation date (newest first)
    allForms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      forms: allForms,
      stats: {
        total: allForms.length,
        byCategory: {
          general: allForms.filter(form => form.category === 'General').length,
          inspection: allForms.filter(form => form.category === 'Inspection').length
        },
        byStatus: {
          active: allForms.filter(form => form.status === 'ACTIVE').length,
          inactive: allForms.filter(form => form.status === 'INACTIVE').length,
          draft: allForms.filter(form => form.status === 'DRAFT').length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch forms'
    });
  }
});






// PATCH /forms/:formId/status - Update form status
router.patch('/forms/:formId/status', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { formId } = req.params;
    const { status, formType } = req.body;
    const { companyId } = req.user;

    // Validate status
    if (!['ACTIVE', 'INACTIVE', 'DRAFT'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be ACTIVE, INACTIVE, or DRAFT'
      });
    }

    // Validate formType - updated with all new form types
    const validFormTypes = [
      'siteSignIn', 'siteInduction', 'safetyCheck', 'incidentReport', 'dailyReport',
      'psychosocialHazard', 'companyInduction', 'preStartStaff', 'dailyPreStartContractor',
      'toolboxMeeting', 'hazardRiskAssessment', 'hazardReport', 'swmsInspection',
      'directorWorksiteChecklist', 'taskCard', 'vehicleInspection', 'ewpInspection',
      'telehandlerInspection', 'employeeChecklist', 'siteManagerInspection', 'detailedInspectionReport'
    ];
    
    if (!validFormTypes.includes(formType)) {
      return res.status(400).json({
        error: 'Invalid form type',
        message: 'Form type must be one of: ' + validFormTypes.join(', ')
      });
    }

    let updatedForm;

    // Update the appropriate form table based on formType
    switch (formType) {
      // EXISTING FORMS
      case 'siteSignIn':
        updatedForm = await prisma.siteSignInForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'siteInduction':
        updatedForm = await prisma.siteInductionForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'safetyCheck':
        updatedForm = await prisma.safetyCheckForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'incidentReport':
        updatedForm = await prisma.incidentReportForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'dailyReport':
        updatedForm = await prisma.dailyReportForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
        
      // NEW GENERAL FORMS
      case 'psychosocialHazard':
        updatedForm = await prisma.psychosocialHazardForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'companyInduction':
        updatedForm = await prisma.companyInductionForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'preStartStaff':
        updatedForm = await prisma.preStartStaffForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'dailyPreStartContractor':
        updatedForm = await prisma.dailyPreStartContractorForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'toolboxMeeting':
        updatedForm = await prisma.toolboxMeetingForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'hazardRiskAssessment':
        updatedForm = await prisma.hazardRiskAssessmentForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'hazardReport':
        updatedForm = await prisma.hazardReportForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'swmsInspection':
        updatedForm = await prisma.swmsInspectionForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'directorWorksiteChecklist':
        updatedForm = await prisma.directorWorksiteChecklistForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'taskCard':
        updatedForm = await prisma.taskCardForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
        
      // NEW INSPECTION FORMS
      case 'vehicleInspection':
        updatedForm = await prisma.vehicleInspectionForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'ewpInspection':
        updatedForm = await prisma.ewpInspectionForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'telehandlerInspection':
        updatedForm = await prisma.telehandlerInspectionForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'employeeChecklist':
        updatedForm = await prisma.employeeChecklistForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'siteManagerInspection':
        updatedForm = await prisma.siteManagerInspectionForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
      case 'detailedInspectionReport':
        updatedForm = await prisma.detailedInspectionReportForm.update({
          where: { id: formId, companyId },
          data: { status }
        });
        break;
    }

    res.json({
      success: true,
      message: `Form status updated to ${status}`,
      form: updatedForm
    });

  } catch (error) {
    console.error('Error updating form status:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Form not found',
        message: 'Form not found or you do not have permission to update it'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update form status'
    });
  }
});

// GET /forms/:formId - Get single form details
router.get('/forms/:formId', async (req, res) => {
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

    let form;
    switch (formType) {
      // EXISTING FORMS
      case 'siteSignIn':
        form = await prisma.siteSignInForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'siteInduction':
        form = await prisma.siteInductionForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'safetyCheck':
        form = await prisma.safetyCheckForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'incidentReport':
        form = await prisma.incidentReportForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'dailyReport':
        form = await prisma.dailyReportForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
        
      // NEW GENERAL FORMS
      case 'psychosocialHazard':
        form = await prisma.psychosocialHazardForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'companyInduction':
        form = await prisma.companyInductionForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'preStartStaff':
        form = await prisma.preStartStaffForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'dailyPreStartContractor':
        form = await prisma.dailyPreStartContractorForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'toolboxMeeting':
        form = await prisma.toolboxMeetingForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'hazardRiskAssessment':
        form = await prisma.hazardRiskAssessmentForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'hazardReport':
        form = await prisma.hazardReportForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'swmsInspection':
        form = await prisma.swmsInspectionForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'directorWorksiteChecklist':
        form = await prisma.directorWorksiteChecklistForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'taskCard':
        form = await prisma.taskCardForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
        
      // NEW INSPECTION FORMS
      case 'vehicleInspection':
        form = await prisma.vehicleInspectionForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'ewpInspection':
        form = await prisma.ewpInspectionForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'telehandlerInspection':
        form = await prisma.telehandlerInspectionForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'employeeChecklist':
        form = await prisma.employeeChecklistForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'siteManagerInspection':
        form = await prisma.siteManagerInspectionForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
      case 'detailedInspectionReport':
        form = await prisma.detailedInspectionReportForm.findFirst({
          where: { id: formId, companyId },
          include: { _count: { select: { submissions: true } } }
        });
        break;
        
      default:
        return res.status(400).json({
          error: 'Invalid form type'
        });
    }

    if (!form) {
      return res.status(404).json({
        error: 'Form not found'
      });
    }

    res.json({
      success: true,
      form: {
        ...form,
        submissions: form._count.submissions,
        formType
      }
    });

  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch form'
    });
  }
});

// GET /public/:subdomain/forms - Get public forms for a company (only ACTIVE forms)
router.get('/public/:subdomain/forms', async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Find company by subdomain
    const company = await prisma.company.findUnique({
      where: { subdomain },
      select: { id: true, name: true, subdomain: true }
    });

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: 'Invalid subdomain'
      });
    }

    // Get only ACTIVE forms for the company
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
      company: {
        name: company.name,
        subdomain: company.subdomain
      },
      forms: activeForms,
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
      message: 'Failed to fetch public forms'
    });
  }
});



async function initializeCompanyForms(companyId) {
  try {
    // Check if forms already exist
    const existingForms = await prisma.siteSignInForm.findFirst({
      where: { companyId }
    });

    if (existingForms) {
      console.log(`✅ Forms already exist for company: ${companyId}`);
      return;
    }

    // Create all default forms for the company (all ACTIVE by default)
    await Promise.all([
      // EXISTING FORMS
      prisma.siteSignInForm.create({
        data: {
          companyId,
          formName: 'Site Sign-In',
          description: 'Daily worker sign-in form with time tracking',
          status: 'ACTIVE'
        }
      }),
      prisma.siteInductionForm.create({
        data: {
          companyId,
          formName: 'Site Induction',
          description: 'New worker safety induction and orientation',
          status: 'ACTIVE'
        }
      }),
      prisma.safetyCheckForm.create({
        data: {
          companyId,
          formName: 'Safety Check',
          description: 'Daily site safety compliance checklist',
          status: 'ACTIVE'
        }
      }),
      prisma.incidentReportForm.create({
        data: {
          companyId,
          formName: 'Incident Report',
          description: 'Workplace incident or near-miss reporting',
          status: 'ACTIVE'
        }
      }),
      prisma.dailyReportForm.create({
        data: {
          companyId,
          formName: 'Daily Report',
          description: 'End of day project status and progress report',
          status: 'ACTIVE'
        }
      }),

      // NEW GENERAL FORMS
      prisma.psychosocialHazardForm.create({
        data: {
          companyId,
          formName: 'Report Psychosocial Hazards',
          description: 'Documentation of workplace psychosocial hazards',
          status: 'ACTIVE'
        }
      }),
      prisma.companyInductionForm.create({
        data: {
          companyId,
          formName: 'Company Induction',
          description: 'Mandatory induction checklist for new workers',
          status: 'ACTIVE'
        }
      }),
      prisma.preStartStaffForm.create({
        data: {
          companyId,
          formName: 'Pre Start Staff',
          description: 'Pre-work checklist for staff',
          status: 'ACTIVE'
        }
      }),
      prisma.dailyPreStartContractorForm.create({
        data: {
          companyId,
          formName: 'Daily Pre Start Contractors',
          description: 'Daily pre-work checklist for contractors',
          status: 'ACTIVE'
        }
      }),
      prisma.toolboxMeetingForm.create({
        data: {
          companyId,
          formName: 'Toolbox Meeting',
          description: 'Safety meeting documentation',
          status: 'ACTIVE'
        }
      }),
      prisma.hazardRiskAssessmentForm.create({
        data: {
          companyId,
          formName: 'Hazard Risk Assessment Form',
          description: 'Form to assess potential hazards on site',
          status: 'ACTIVE'
        }
      }),
      prisma.hazardReportForm.create({
        data: {
          companyId,
          formName: 'Hazard Report Form',
          description: 'Form to report hazards on site',
          status: 'ACTIVE'
        }
      }),
      prisma.swmsInspectionForm.create({
        data: {
          companyId,
          formName: 'Spot & SWMS Inspection Checklist',
          description: 'Checklist for safety inspections and SWMS compliance',
          status: 'ACTIVE'
        }
      }),
      prisma.directorWorksiteChecklistForm.create({
        data: {
          companyId,
          formName: 'Director Worksite Checklist',
          description: 'Checklist for management review of worksite conditions',
          status: 'ACTIVE'
        }
      }),
      prisma.taskCardForm.create({
        data: {
          companyId,
          formName: 'Task Card',
          description: 'Task card for management',
          status: 'ACTIVE'
        }
      }),

      // NEW INSPECTION FORMS
      prisma.vehicleInspectionForm.create({
        data: {
          companyId,
          formName: 'Vehicle Inspection',
          description: 'Regular vehicle safety inspection form',
          status: 'ACTIVE'
        }
      }),
      prisma.ewpInspectionForm.create({
        data: {
          companyId,
          formName: 'EWP Inspection',
          description: 'Elevated Work Platform inspection checklist',
          status: 'ACTIVE'
        }
      }),
      prisma.telehandlerInspectionForm.create({
        data: {
          companyId,
          formName: 'Telehandler Daily Inspection Checklist',
          description: 'Daily inspection for telehandler equipment',
          status: 'ACTIVE'
        }
      }),
      prisma.employeeChecklistForm.create({
        data: {
          companyId,
          formName: 'Employee / Subcontractor Checklist',
          description: 'Verification checklist for workers',
          status: 'ACTIVE'
        }
      }),
      prisma.siteManagerInspectionForm.create({
        data: {
          companyId,
          formName: 'Quick Site Manager Daily Workplace Inspection',
          description: 'Daily site inspection checklist',
          status: 'ACTIVE'
        }
      }),
      prisma.detailedInspectionReportForm.create({
        data: {
          companyId,
          formName: 'SAFECOM HSEQ Advisor Detailed Inspection Report',
          description: 'Comprehensive site inspection report',
          status: 'ACTIVE'
        }
      })
    ]);

    console.log(`✅ All 21 default forms created for company: ${companyId}`);
  } catch (error) {
    console.error('❌ Error initializing company forms:', error);
    throw error;
  }
}

router.post('/initialize-forms', async (req, res) => {
  const { companyId } = req.body;
  
  try {
    // Check if forms already exist
    const existingForms = await prisma.siteSignInForm.findFirst({
      where: { companyId }
    });

    if (existingForms) {
      return res.json({ 
        message: `✅ Forms already exist for company: ${companyId}`,
        formsCount: 'Unknown (already exists)'
      });
    }

    // Create all default forms for the company (all ACTIVE by default)
    await Promise.all([
      // EXISTING FORMS (5)
      prisma.siteSignInForm.create({
        data: {
          companyId,
          formName: 'Site Sign-In',
          description: 'Daily worker sign-in form with time tracking',
          status: 'ACTIVE'
        }
      }),
      prisma.siteInductionForm.create({
        data: {
          companyId,
          formName: 'Site Induction',
          description: 'New worker safety induction and orientation',
          status: 'ACTIVE'
        }
      }),
      prisma.safetyCheckForm.create({
        data: {
          companyId,
          formName: 'Safety Check',
          description: 'Daily site safety compliance checklist',
          status: 'ACTIVE'
        }
      }),
      prisma.incidentReportForm.create({
        data: {
          companyId,
          formName: 'Incident Report',
          description: 'Workplace incident or near-miss reporting',
          status: 'ACTIVE'
        }
      }),
      prisma.dailyReportForm.create({
        data: {
          companyId,
          formName: 'Daily Report',
          description: 'End of day project status and progress report',
          status: 'ACTIVE'
        }
      }),

      // NEW GENERAL FORMS (10)
      prisma.psychosocialHazardForm.create({
        data: {
          companyId,
          formName: 'Report Psychosocial Hazards',
          description: 'Documentation of workplace psychosocial hazards',
          status: 'ACTIVE'
        }
      }),
      prisma.companyInductionForm.create({
        data: {
          companyId,
          formName: 'Company Induction',
          description: 'Mandatory induction checklist for new workers',
          status: 'ACTIVE'
        }
      }),
      prisma.preStartStaffForm.create({
        data: {
          companyId,
          formName: 'Pre Start Staff',
          description: 'Pre-work checklist for staff',
          status: 'ACTIVE'
        }
      }),
      prisma.dailyPreStartContractorForm.create({
        data: {
          companyId,
          formName: 'Daily Pre Start Contractors',
          description: 'Daily pre-work checklist for contractors',
          status: 'ACTIVE'
        }
      }),
      prisma.toolboxMeetingForm.create({
        data: {
          companyId,
          formName: 'Toolbox Meeting',
          description: 'Safety meeting documentation',
          status: 'ACTIVE'
        }
      }),
      prisma.hazardRiskAssessmentForm.create({
        data: {
          companyId,
          formName: 'Hazard Risk Assessment Form',
          description: 'Form to assess potential hazards on site',
          status: 'ACTIVE'
        }
      }),
      prisma.hazardReportForm.create({
        data: {
          companyId,
          formName: 'Hazard Report Form',
          description: 'Form to report hazards on site',
          status: 'ACTIVE'
        }
      }),
      prisma.swmsInspectionForm.create({
        data: {
          companyId,
          formName: 'Spot & SWMS Inspection Checklist',
          description: 'Checklist for safety inspections and SWMS compliance',
          status: 'ACTIVE'
        }
      }),
      prisma.directorWorksiteChecklistForm.create({
        data: {
          companyId,
          formName: 'Director Worksite Checklist',
          description: 'Checklist for management review of worksite conditions',
          status: 'ACTIVE'
        }
      }),
      prisma.taskCardForm.create({
        data: {
          companyId,
          formName: 'Task Card',
          description: 'Task card for management',
          status: 'ACTIVE'
        }
      }),

      // NEW INSPECTION FORMS (6)
      prisma.vehicleInspectionForm.create({
        data: {
          companyId,
          formName: 'Vehicle Inspection',
          description: 'Regular vehicle safety inspection form',
          status: 'ACTIVE'
        }
      }),
      prisma.ewpInspectionForm.create({
        data: {
          companyId,
          formName: 'EWP Inspection',
          description: 'Elevated Work Platform inspection checklist',
          status: 'ACTIVE'
        }
      }),
      prisma.telehandlerInspectionForm.create({
        data: {
          companyId,
          formName: 'Telehandler Daily Inspection Checklist',
          description: 'Daily inspection for telehandler equipment',
          status: 'ACTIVE'
        }
      }),
      prisma.employeeChecklistForm.create({
        data: {
          companyId,
          formName: 'Employee / Subcontractor Checklist',
          description: 'Verification checklist for workers',
          status: 'ACTIVE'
        }
      }),
      prisma.siteManagerInspectionForm.create({
        data: {
          companyId,
          formName: 'Quick Site Manager Daily Workplace Inspection',
          description: 'Daily site inspection checklist',
          status: 'ACTIVE'
        }
      }),
      prisma.detailedInspectionReportForm.create({
        data: {
          companyId,
          formName: 'SAFECOM HSEQ Advisor Detailed Inspection Report',
          description: 'Comprehensive site inspection report',
          status: 'ACTIVE'
        }
      })
    ]);

    return res.json({ 
      message: `✅ All 21 default forms created for company: ${companyId}`,
      formsCount: '21 forms created',
      breakdown: {
        existingForms: 5,
        newGeneralForms: 10,
        newInspectionForms: 6,
        total: 21
      }
    });
    
  } catch (error) {
    console.error('❌ Error initializing company forms:', error);
    return res.status(500).json({ 
      error: 'Failed to initialize forms',
      message: error.message 
    });
  }
});

module.exports = router;

// Export the helper function for use in other modules
module.exports.initializeCompanyForms = initializeCompanyForms;
