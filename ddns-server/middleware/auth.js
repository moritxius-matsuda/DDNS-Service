const jwt = require('jsonwebtoken');
const { redis } = require('../server');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token exists in Redis (for revocation)
    const tokenExists = await redis.get(`token:${decoded.jti}`);
    if (!tokenExists) {
      return res.status(401).json({ error: 'Token revoked or invalid' });
    }

    // Get user data from Redis
    const userData = await redis.get(`user:${decoded.userId}`);
    if (!userData) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      ...decoded,
      ...JSON.parse(userData)
    };
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = authMiddleware;