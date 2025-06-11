const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendWelcomeEmail } = require('../services/emailService');
const authService = require('../services/authService');

const prisma = new PrismaClient();

// Helper function to generate temp password
const generateTempPassword = () => {
  return crypto.randomBytes(8).toString('hex');
};

const getAllUsers = async (req, res) => {
  try {
    const companyId = req.user.companyId; // Get from JWT token

    if (!companyId) {
      return res.status(400).json({
        error: "Company ID not found",
        message: "User must be associated with a company",
      });
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        loginCount: true,
        isEmailVerified: true,
        // Don't include password or other sensitive fields
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch users",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const user = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: companyId // Ensure user can only access their company's users
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        loginCount: true,
        isEmailVerified: true,
        // Don't include password
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found or you do not have access to it'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user'
    });
  }
};

const createNewUser = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      role, 
      status,
      sendCredentials 
    } = req.body;

    console.log('🎯 Creating new user:', { firstName, lastName, email, role });

    // Validation
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'First name, last name, email, and role are required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        error: 'Company ID not found',
        message: 'User must be associated with a company'
      });
    }

    // Validate role
    const validRoles = ['ADMIN', 'MANAGER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be either ADMIN or MANAGER'
      });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'A user with this email address already exists'
      });
    }

    // Get company information for email
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        subdomain: true
      }
    });

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: 'Associated company not found'
      });
    }

    // Use transaction for user creation
    const result = await prisma.$transaction(async (tx) => {
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      const hashedPassword = await authService.hashPassword(tempPassword);

      console.log('🔐 Generated temp password for:', email);

      // Create user
      const user = await tx.user.create({
        data: {
          companyId: companyId,
          firstName,
          lastName,
          email,
          phone: phone || null,
          role,
          status: status || 'ACTIVE',
          password: hashedPassword,
          isEmailVerified: false
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true
        }
      });

      console.log('✅ User created:', user.id);

      return { user, tempPassword };
    });

    // Send welcome email if requested
    if (sendCredentials) {
      try {
        console.log('📧 Sending welcome email to:', email);
        
        await sendWelcomeEmail({
          email: result.user.email,
          companyName: company.name,
          subdomain: company.subdomain,
          firstName: result.user.firstName,
          tempPassword: result.tempPassword,
          loginUrl: `${process.env.FRONTEND_URL}/login`
        });
        
        console.log('✅ Welcome email sent successfully');
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError);
        // Don't fail the user creation for email errors
      }
    }

    res.status(201).json({
      message: sendCredentials 
        ? 'User created successfully and welcome email sent' 
        : 'User created successfully',
      user: {
        ...result.user,
        company: {
          id: company.id,
          name: company.name
        }
      }
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create user'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      role, 
      status 
    } = req.body;

    // Check if user exists and belongs to company
    const existingUser = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: companyId
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found or you do not have access to it'
      });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['ADMIN', 'MANAGER'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role',
          message: 'Role must be either ADMIN or MANAGER'
        });
      }
    }

    // Check for duplicate email (excluding current user)
    if (email && email !== existingUser.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: {
          email: email
        }
      });

      if (duplicateUser) {
        return res.status(400).json({
          error: 'Email already exists',
          message: 'A user with this email address already exists'
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(role && { role }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const currentUserId = req.user.id;

    // Check if user exists and belongs to company
    const existingUser = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: companyId
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found or you do not have access to it'
      });
    }

    // Prevent user from deleting themselves
    if (id === currentUserId) {
      return res.status(400).json({
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }

    // Check if user has any form submissions (you might want to handle this differently)
    const submissionCount = await prisma.user.findUnique({
      where: { id: id },
      select: {
        _count: {
          select: {
            dailyReportSubmissions: true,
            incidentReportSubmissions: true,
            safetyCheckSubmissions: true,
            siteInductionSubmissions: true,
            siteSignInSubmissions: true,
            // Add other submission types as needed
          }
        }
      }
    });

    const totalSubmissions = Object.values(submissionCount._count).reduce((acc, count) => acc + count, 0);

    if (totalSubmissions > 0) {
      return res.status(400).json({
        error: 'Cannot delete user',
        message: 'This user has form submissions associated with them. Consider deactivating instead of deleting.'
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: id }
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete user'
    });
  }
};

const resendUserCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    console.log('🔄 Resending credentials for user:', id);

    // Check if user exists and belongs to company
    const user = await prisma.user.findFirst({
      where: {
        id: id,
        companyId: companyId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found or you do not have access to it'
      });
    }

    // Use transaction for credential reset
    const result = await prisma.$transaction(async (tx) => {
      // Generate a new temporary password
      const tempPassword = generateTempPassword();
      const hashedPassword = await authService.hashPassword(tempPassword);

      console.log('🔐 Generated new temp password for:', user.email);

      // Update user's password
      await tx.user.update({
        where: { id: id },
        data: {
          password: hashedPassword,
          isEmailVerified: false // Reset email verification
        }
      });

      return { tempPassword };
    });

    // Send credentials via email
    try {
      console.log('📧 Sending new credentials to:', user.email);
      
      await sendWelcomeEmail({
        email: user.email,
        companyName: user.company.name,
        subdomain: user.company.subdomain,
        firstName: user.firstName,
        tempPassword: result.tempPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      });
      
      console.log('✅ Credentials email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send credentials email:', emailError);
      return res.status(500).json({
        error: 'Email service error',
        message: 'Failed to send credentials email'
      });
    }

    res.json({
      message: 'Credentials sent successfully'
    });
  } catch (error) {
    console.error('❌ Error resending credentials:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resend credentials'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createNewUser,
  updateUser,
  deleteUser,
  resendUserCredentials
};