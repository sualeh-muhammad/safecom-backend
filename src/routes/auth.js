const express = require('express');
const authService = require('../services/authService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    const result = await authService.login(email, password);

    res.json({
      message: 'Login successful',
      ...result
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            logoImageUrl: true,
            currentPlan: true,
            subscriptionStatus: true
          }
        },
        jobSite: {
          select: {
            id: true,
            jobsiteName: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      ...userWithoutPassword,
      permissions: user.role === 'SUPER_ADMIN' ? {
        canManageCompanies: user.canManageCompanies,
        canViewPayments: user.canViewPayments,
        canAccessReports: user.canAccessReports
      } : null
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user profile'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = authService.generateToken(user);

    res.json({
      token: newToken,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh token'
    });
  }
});

module.exports = router;