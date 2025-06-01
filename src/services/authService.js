const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AuthService {
  // Generate JWT token
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'elie-forms',
      audience: 'elie-forms-users'
    });
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async login(email, password) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
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
        throw new Error('Invalid email or password');
      }

      if (user.status !== 'ACTIVE') {
        throw new Error('Account is not active');
      }

      // Check password
      const isPasswordValid = await this.comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update login tracking
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          loginCount: { increment: 1 }
        }
      });

      const token = this.generateToken(user);

      const { password: _, ...userWithoutPassword } = user;

      return {
        token,
        user: {
          ...userWithoutPassword,
          permissions: user.role === 'SUPER_ADMIN' ? {
            canManageCompanies: user.canManageCompanies,
            canViewPayments: user.canViewPayments,
            canAccessReports: user.canAccessReports
          } : null
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'elie-forms',
        audience: 'elie-forms-users'
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async createUser(userData) {
    try {
      const hashedPassword = await this.hashPassword(userData.password);
      
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              logoImageUrl: true
            }
          }
        }
      });

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();