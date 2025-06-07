const superAdminAuthService = require('../services/superAdminAuthService');

const superAdminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Super Admin access required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = superAdminAuthService.verifyToken(token);
    
    // Ensure it's a super admin token
    if (decoded.type !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    req.superAdmin = {
      id: decoded.superAdminId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid super admin token' });
  }
};

module.exports = { superAdminAuth };