const authService = require('../services/authService');
const jwt = require('jsonwebtoken');


const authMiddleware = (req, res, next) => {

   const authHeader = req.headers.authorization;

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'No authorization header provided' 
      });
    }

        const token = authHeader.split(' ')[1];

    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'No token provided' 
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    req.user = {
      userId: decoded.userId,
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId  // ✅ Always from token
    };
    next();

  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token',
      message: error.message 
    });
  }
};

// Role-based middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = { authMiddleware, requireRole };