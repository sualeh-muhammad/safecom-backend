const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { uploadToCloudinary, upload } = require('../middleware/upload');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Get company information
router.get('/', async (req, res) => {
  try {
    const { companyId } = req.user; // From your auth middleware

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        logoImageUrl: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        country: true
      }
    });

    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }

    res.json({ 
      success: true, 
      data: company 
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update company information
router.put('/', async (req, res) => {
  try {
    const { companyId } = req.user;
    const {
      name,
      email,
      phone,
      website,
      streetAddress,
      city,
      state,
      zipCode,
      country
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Company name and email are required'
      });
    }

    // Check if email is already taken by another company
    const existingCompany = await prisma.company.findFirst({
      where: {
        email: email,
        NOT: { id: companyId }
      }
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use by another company'
      });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        email,
        phone,
        website,
        streetAddress,
        city,
        state,
        zipCode,
        country
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        logoImageUrl: true,
        streetAddress: true,
        city: true,
        state: true,
        zipCode: true,
        country: true
      }
    });

    res.json({ 
      success: true, 
      data: updatedCompany,
      message: 'Company information updated successfully'
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Upload company logo
router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    const { companyId } = req.user;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'company-logos',
      public_id: `company_${companyId}_logo_${Date.now()}`,
      transformation: [
        { width: 512, height: 512, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ]
    });

    // Update company with new logo URL
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { logoImageUrl: uploadResult.secure_url },
      select: {
        id: true,
        name: true,
        logoImageUrl: true
      }
    });


    res.json({
      success: true,
      data: {
        logoImageUrl: updatedCompany.logoImageUrl
      },
      message: 'Logo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo'
    });
  }
});

// Delete company logo
router.delete('/logo', async (req, res) => {
  try {
    const { companyId } = req.user;

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { logoImageUrl: null },
      select: {
        id: true,
        name: true,
        logoImageUrl: true
      }
    });

    res.json({
      success: true,
      data: {
        logoImageUrl: null
      },
      message: 'Logo removed successfully'
    });
  } catch (error) {
    console.error('Error removing logo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove logo'
    });
  }
});

module.exports = router;