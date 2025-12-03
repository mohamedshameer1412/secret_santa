const jwt = require('jsonwebtoken');

// ======================== PROTECT MIDDLEWARE ========================
// Verifies JWT token and attaches user to request
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // No token found
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized - no token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (handle both token structures)
    req.user = decoded.user || { id: decoded.id, role: decoded.role };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized - invalid token' 
    });
  }
};

// ======================== AUTHORIZE MIDDLEWARE ========================
// Restricts access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized - user not authenticated' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied - ${req.user.role} role not authorized` 
      });
    }

    next();
  };
};

// ======================== ADMIN ONLY SHORTHAND ========================
// Convenience middleware for admin-only routes
exports.adminOnly = exports.authorize('admin');