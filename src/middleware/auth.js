const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
    }
    next();
  } catch (error) {
    next();
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, optionalAuth, authorize };