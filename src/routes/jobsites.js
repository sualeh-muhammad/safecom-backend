// // src/routes/jobsites.js - Backend API routes for jobsites

// const express = require('express');
// const  { createNewJobSites, deleteJobSite, getAllJobSites,  getCompanyJobSites , getJobSiteById, updateJobSite } = require('../controllers/jobsites') ;
// const { authMiddleware } = require( '../middleware/auth')

// const router = express.Router();

// // router.use(authMiddleware);

// router.get('/', getAllJobSites );

// router.get('/:id', getJobSiteById  );

// router.get('/company/:companyId', getCompanyJobSites );

// router.post('/', createNewJobSites );

// router.put('/:id', updateJobSite );

// router.delete('/:id',deleteJobSite );

// module.exports = router;



const express = require('express');
const { 
  createNewJobSites, 
  deleteJobSite, 
  getAllJobSites, 
  getCompanyJobSites, 
  getJobSiteById, 
  updateJobSite 
} = require('../controllers/jobsites');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Enable auth middleware for protected routes
router.use(authMiddleware);

// Get all jobsites for authenticated user's company
router.get('/', getAllJobSites);

// Get specific jobsite by ID
router.get('/:id', getJobSiteById);

// Get jobsites by company ID (change to POST since it needs body data)
router.post('/company/:companyId', getCompanyJobSites);

// Create new jobsite
router.post('/', createNewJobSites);

// Update jobsite
router.put('/:id', updateJobSite);

// Delete jobsite
router.delete('/:id', deleteJobSite);

module.exports = router;