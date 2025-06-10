const express = require('express');
const cors = require('cors');
const helmet = require('helmet');  
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const onboardingRoutes = require('./src/routes/onboarding');
const stripeRoutes = require('./src/routes/stripe');
const auth0Management = require('./src/config/auth0')
const authRoutes = require('./src/routes/auth')
const jobSiteRoutes = require('./src/routes/jobsites')
const companyRoutes = require('./src/routes/company')
const paymentHistoryRoutes = require('./src/routes/paymentHistory')
const formRoutes = require('./src/routes/forms')
const submissionRoutes = require('./src/routes/submissions')
const adminCompanyRoutes = require('./src/routes/adminCompany');
const publicFormsRoutes = require('./src/routes/publicForms');
const { createHash, verifyHash, generatePublicUrl } = require('./src/utils/hashUtils');
// const superAdminRoutes = require('./src/routes/superAdmin');
const superAdminRoutes = require('./src/routes/superAdminCompany');


//////// Form Routes

const SiteSignInRoutes = require('./src/routes/Forms/siteSignIn')
const psychosocialHazardRoutes = require('./src/routes/Forms/psychosocialHazard');
// const hazardReportRoutes = require('./src/routes/Forms/hazardReport')
const incidentReportRoutes = require('./src/routes/Forms/incidentReport')
const preStartStaffRoutes = require('./src/routes/Forms/preStartStaff')
const swmsInspectionRoutes = require('./src/routes/Forms/swmsInspection')
const ewpInspectionRoutes = require('./src/routes/Forms/ewpInspection')
const vehicleInspectionRoutes = require('./src/routes/Forms/vehicleInspection')
const siteManagerInspectionRoutes = require('./src/routes/Forms/siteManagerInspection')
const knowledgeBaseRoutes = require('./src/routes/knowledgeBase');
const chatRoutes = require('./src/routes/chat');


const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://safecom-website.vercel.app',
      'https://safecom-crm.vercel.app',
      'https://safecom.com',
      'https://safecomcrm.com',
      /\.safecomcrm\.com$/,
      /\.safecom\.com$/
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));



// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'safecom-backend',
    environment: process.env.NODE_ENV || 'development',
    database: 'Connected' // You can add actual DB check here
  });
});

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Safecom Backend API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      onboarding: '/api/onboarding',
      forms: '/api/forms',
      submissions: '/api/submissions'
    }
  });
});
// // API Routes



app.use('/api/onboarding', onboardingRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/auth' , authRoutes)
app.use('/api/jobsites' , jobSiteRoutes)
app.use('/api/company' , companyRoutes)
app.use('/api/payment-history' , paymentHistoryRoutes)
app.use('/api/forms' ,  formRoutes)
app.use('/api/submission' , submissionRoutes)
app.use('/api/admin-companies' , adminCompanyRoutes)
app.use('/api/public-forms' , publicFormsRoutes)
app.use('/api/super-admin', superAdminRoutes);



//*******************  Form Routes  ******************* //


app.use('/api/site-signin', SiteSignInRoutes);
app.use('/api/psychosocial-hazard', psychosocialHazardRoutes); 
// app.use('/api/hazard-report', hazardReportRoutes); 
app.use('/api/incident-report', incidentReportRoutes); // Add this line

app.use('/api/pre-start-staff', preStartStaffRoutes); // Add this line
app.use('/api/swms-inspection' , swmsInspectionRoutes);
app.use('/api/ewp-inspection' , ewpInspectionRoutes );
app.use('/api/vehicle-inspection' , vehicleInspectionRoutes );
app.use('/api/site-manager-inspection' ,  siteManagerInspectionRoutes)
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/chat', chatRoutes);

// Test endpoint to verify setup
app.get('/api/test-ai-setup', (req, res) => {
  res.json({ 
    success: true, 
    message: 'AI routes are working',
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    routes: [
      '/api/chat/user-state',
      '/api/chat',
      '/api/knowledge-base'
    ]
  });
});




module.exports = app;