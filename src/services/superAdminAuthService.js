// services/superAdminAuthService.js - FIXED VERSION

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class SuperAdminAuthService {
  // Generate JWT token with super admin prefix
  generateToken(superAdmin) {
    const payload = {
      superAdminId: superAdmin.id,
      email: superAdmin.email,
      role: 'SUPER_ADMIN',
      type: 'super_admin' // Distinguish from regular user tokens
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { // Use existing JWT_SECRET for now
      expiresIn: '7d',
      issuer: 'elie-forms-super-admin'
    });
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Login method
  async login(email, password) {
    try {
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { email, isActive: true }
      });

      if (!superAdmin) {
        throw new Error('Invalid credentials');
      }

      // Handle case where password might not be set (existing records)
      if (!superAdmin.password) {
        throw new Error('Account not properly configured. Please contact system administrator.');
      }

      const isPasswordValid = await this.comparePassword(password, superAdmin.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // FIXED: Only update fields that exist in the current schema
      try {
        await prisma.superAdmin.update({
          where: { id: superAdmin.id },
          data: {
            lastLoginAt: new Date(),
            // Only include loginCount if the field exists in your current schema
            ...(superAdmin.loginCount !== undefined && { 
              loginCount: { increment: 1 } 
            })
          }
        });
      } catch (updateError) {
        // If update fails, log but don't break login
        console.warn('Could not update login tracking:', updateError.message);
      }

      const token = this.generateToken(superAdmin);
      const { password: _, ...adminWithoutPassword } = superAdmin;

      return { token, superAdmin: adminWithoutPassword };
    } catch (error) {
      console.error('SuperAdmin login error:', error);
      throw error;
    }
  }

  // Token verification
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET, { // Use existing JWT_SECRET
      issuer: 'elie-forms-super-admin'
    });
  }

  // Create SuperAdmin (utility method)
  async createSuperAdmin(data) {
    try {
      const hashedPassword = await this.hashPassword(data.password);
      
      const superAdmin = await prisma.superAdmin.create({
        data: {
          ...data,
          password: hashedPassword
        }
      });

      const { password: _, ...adminWithoutPassword } = superAdmin;
      return adminWithoutPassword;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SuperAdminAuthService();