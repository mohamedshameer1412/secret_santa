const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  
  // Check for token in cookies first (for browser clients)
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  // Then check ers (for API clients)
  else if (req.ers.authorization && req.ers.authorization.startsWith('Bearer')) {
    token = req.ers.authorization.split(' ')[1];
  }

 // Make sure token exists
  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Try both token structures
        if (decoded.user) {
            req.user = decoded.user;
        } else {
            req.user = { id: decoded.id, role: decoded.role };
        }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

// Add this new middleware specifically for admin routes
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin only' });
  }
};