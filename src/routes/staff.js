// src/routes/users.js - Backend API routes for users

const express = require('express');
const { 
  createNewUser, 
  deleteUser, 
  getAllUsers, 
  getUserById, 
  updateUser,
  resendUserCredentials
} = require('../controllers/staff');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all users for the company
router.get('/', getAllUsers);

// Get specific user by ID
router.get('/:id', getUserById);

// Create new user
router.post('/', createNewUser);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Resend credentials to user
router.post('/:id/resend-credentials', resendUserCredentials);

module.exports = router;