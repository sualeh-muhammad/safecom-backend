// src/routes/jobsites.js - Backend API routes for jobsites

const express = require('express');
const  { createNewJobSites, deleteJobSite, getAllJobSites, getJobSiteById, updateJobSite } = require('../controllers/jobsites') ;
const { authMiddleware } = require( '../middleware/auth')

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllJobSites );

router.get('/:id', getJobSiteById  );

router.post('/', createNewJobSites );

router.put('/:id', updateJobSite );

router.delete('/:id',deleteJobSite );

module.exports = router;