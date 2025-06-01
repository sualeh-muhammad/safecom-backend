// utils/hashUtils.js
const crypto = require('crypto');

// Use environment variable for secret key
const SECRET_KEY = process.env.HASH_SECRET_KEY || 'your-super-secret-key-change-this-in-production';

// Create hash from company ID
const createHash = (companyId) => {
  try {
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(companyId);
    const hash = hmac.digest('hex');
    
    // Return first 16 characters for URL friendliness
    return hash.substring(0, 16);
  } catch (error) {
    console.error('Error creating hash:', error);
    throw new Error('Failed to create hash');
  }
};

// Verify hash against company ID
const verifyHash = (hash, companyId) => {
  try {
    const expectedHash = createHash(companyId);
    return hash === expectedHash;
  } catch (error) {
    console.error('Error verifying hash:', error);
    return false;
  }
};

// Generate secure public URL for company
const generatePublicUrl = (companyId, baseUrl = process.env.FRONTEND_URL) => {
  const hash = createHash(companyId);
  return `${baseUrl}/forms/${hash}`;
};

// Find company ID by hash (requires database lookup)
const findCompanyByHash = async (hash, prisma) => {
  try {
    // Get all companies and check hash
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: { id: true, name: true, subdomain: true }
    });

    for (const company of companies) {
      if (verifyHash(hash, company.id)) {
        return company;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding company by hash:', error);
    return null;
  }
};

module.exports = {
  createHash,
  verifyHash,
  generatePublicUrl,
  findCompanyByHash
};