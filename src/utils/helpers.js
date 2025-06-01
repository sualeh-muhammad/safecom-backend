const crypto = require('crypto');

// Generate secure temporary password
const generateTempPassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Generate unique transaction ID
const generateTransactionId = () => {
  return `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

// Validate subdomain format
const isValidSubdomain = (subdomain) => {
  const regex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
  return regex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 63;
};

// Sanitize subdomain input
const sanitizeSubdomain = (input) => {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 63);
};

module.exports = {
  generateTempPassword,
  generateTransactionId,
  isValidSubdomain,
  sanitizeSubdomain
};