const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, extractCompanyId } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply middleware to all routes
router.use(auth);
router.use(extractCompanyId);

// GET /api/users/profile - Get current user's profile
router.get('/profile', async (req, res) => {
  try {
    const auth0UserId = req.user.sub; // Auth0 user ID from JWT
    
    console.log('Auth0 User ID:', auth0UserId);
    console.log('Full user object:', req.user);
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: {
        auth0UserId: auth0UserId
      },
      include: {
        company: user?.role !== 'SUPER_ADMIN' ? {
          select: {
            id: true,
            name: true,
            subdomain: true,
            logoImageUrl: true,
            currentPlan: true,
            subscriptionStatus: true
          }
        } : false,
        jobSite: {
          select: {
            id: true,
            jobsiteName: true
          }
        }
      }
    });

    if (!user) {
      // First-time login - create user
      const email = req.user.email;
      const name = req.user.name || req.user.nickname || '';
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Determine role based on email or custom claims
      let role = 'WORKER';
      let companyId = null;
      
      // Check Auth0 custom claims for role
      if (req.user['https://your-app.com/roles']) {
        const roles = req.user['https://your-app.com/roles'];
        role = roles[0]; // Take first role
      }
      
      // Super admin check
      const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
      if (SUPER_ADMIN_EMAILS.includes(email)) {
        role = 'SUPER_ADMIN';
        companyId = null;
      }

      const newUser = await prisma.user.create({
        data: {
          auth0UserId: auth0UserId,
          email: email,
          firstName: firstName || 'Unknown',
          lastName: lastName || 'User',
          role: role,
          companyId: companyId,
          canManageCompanies: role === 'SUPER_ADMIN',
          canViewPayments: role === 'SUPER_ADMIN',
          canAccessReports: role === 'SUPER_ADMIN',
          isEmailVerified: req.user.email_verified || false,
          loginCount: 1,
          lastLoginAt: new Date()
        },
        include: {
          company: companyId ? {
            select: {
              id: true,
              name: true,
              subdomain: true,
              logoImageUrl: true,
              currentPlan: true
            }
          } : false
        }
      });

      return res.json({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        companyId: newUser.companyId,
        company: newUser.company,
        isFirstLogin: true,
        permissions: newUser.role === 'SUPER_ADMIN' ? {
          canManageCompanies: newUser.canManageCompanies,
          canViewPayments: newUser.canViewPayments,
          canAccessReports: newUser.canAccessReports
        } : null
      });
    }

    // Update login tracking
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 }
      }
    });

    // Return user profile
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      companyId: user.companyId,
      jobSiteId: user.jobSiteId,
      company: user.company,
      jobSite: user.jobSite,
      profilePicture: user.profilePicture,
      lastLoginAt: user.lastLoginAt,
      isEmailVerified: user.isEmailVerified,
      permissions: user.role === 'SUPER_ADMIN' ? {
        canManageCompanies: user.canManageCompanies,
        canViewPayments: user.canViewPayments,
        canAccessReports: user.canAccessReports
      } : null
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch user profile'
    });
  }
});

// Other protected routes...
router.get('/me', async (req, res) => {
  // Alias for profile
  req.url = '/profile';
  return router.handle(req, res);
});

module.exports = router;