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

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Extract tenant from subdomain
// app.use(extractTenant);

// Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV 
//   });
// });

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







module.exports = app;