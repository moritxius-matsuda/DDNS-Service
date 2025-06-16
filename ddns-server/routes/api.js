const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { redis } = require('../server');
const logger = require('../utils/logger');
const authMiddleware = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createHostnameSchema = Joi.object({
  hostname: Joi.string().alphanum().min(1).max(63).required(),
  ip: Joi.string().ip({ version: ['ipv4'] }).required(),
  ttl: Joi.number().integer().min(60).max(86400).default(300)
});

const updateHostnameSchema = Joi.object({
  ip: Joi.string().ip({ version: ['ipv4'] }).optional(),
  ttl: Joi.number().integer().min(60).max(86400).optional()
});

// Create API token for user (called from frontend)
router.post('/tokens', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    // Generate token ID
    const tokenId = crypto.randomUUID();
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId, 
        email,
        jti: tokenId,
        type: 'api'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1y' }
    );

    // Store token in Redis
    await redis.set(`token:${tokenId}`, JSON.stringify({
      userId,
      email,
      createdAt: new Date().toISOString(),
      lastUsed: null
    }), 'EX', 365 * 24 * 60 * 60); // 1 year expiry

    // Store/update user data
    await redis.set(`user:${userId}`, JSON.stringify({
      userId,
      email,
      createdAt: new Date().toISOString()
    }));

    logger.info(`API token created for user ${userId}`);

    res.json({
      token,
      tokenId,
      expiresIn: '1 year'
    });

  } catch (error) {
    logger.error('Token creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's hostnames
router.get('/hostnames', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all hostnames for user
    const userHostnamesKey = `user_hostnames:${userId}`;
    const hostnames = await redis.smembers(userHostnamesKey);
    
    const hostnameDetails = [];
    for (const hostname of hostnames) {
      const data = await redis.get(`hostname:${hostname}`);
      if (data) {
        hostnameDetails.push(JSON.parse(data));
      }
    }

    res.json(hostnameDetails);

  } catch (error) {
    logger.error('Get hostnames error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new hostname
router.post('/hostnames', authMiddleware, async (req, res) => {
  try {
    const { error, value } = createHostnameSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details[0].message 
      });
    }

    const { hostname, ip, ttl } = value;
    const userId = req.user.userId;

    // Check if user already has 2 hostnames (limit)
    const userHostnamesKey = `user_hostnames:${userId}`;
    const existingCount = await redis.scard(userHostnamesKey);
    
    if (existingCount >= 2) {
      return res.status(400).json({ 
        error: 'Maximum hostname limit reached (2 per account)' 
      });
    }

    // Check if hostname already exists
    const existingHostname = await redis.get(`hostname:${hostname}`);
    if (existingHostname) {
      return res.status(409).json({ error: 'Hostname already exists' });
    }

    // Create hostname
    const hostnameData = {
      hostname,
      ip,
      ttl,
      userId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      updatedBy: 'dashboard'
    };

    await redis.set(`hostname:${hostname}`, JSON.stringify(hostnameData));
    await redis.sadd(userHostnamesKey, hostname);

    // Log creation
    const logEntry = {
      hostname,
      action: 'created',
      ip,
      timestamp: new Date().toISOString(),
      updatedBy: 'dashboard'
    };
    await redis.lpush(`logs:${hostname}`, JSON.stringify(logEntry));

    logger.info(`Hostname created: ${hostname} for user ${userId}`);

    res.status(201).json(hostnameData);

  } catch (error) {
    logger.error('Create hostname error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update hostname
router.put('/hostnames/:hostname', authMiddleware, async (req, res) => {
  try {
    const { error, value } = updateHostnameSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details[0].message 
      });
    }

    const hostname = req.params.hostname;
    const userId = req.user.userId;

    // Get existing hostname
    const existingData = await redis.get(`hostname:${hostname}`);
    if (!existingData) {
      return res.status(404).json({ error: 'Hostname not found' });
    }

    const existingHostname = JSON.parse(existingData);
    if (existingHostname.userId !== userId) {
      return res.status(403).json({ error: 'Hostname does not belong to you' });
    }

    // Update hostname
    const updatedHostname = {
      ...existingHostname,
      ...value,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'dashboard'
    };

    await redis.set(`hostname:${hostname}`, JSON.stringify(updatedHostname));

    // Log update
    if (value.ip && value.ip !== existingHostname.ip) {
      const logEntry = {
        hostname,
        oldIp: existingHostname.ip,
        newIp: value.ip,
        timestamp: new Date().toISOString(),
        updatedBy: 'dashboard'
      };
      await redis.lpush(`logs:${hostname}`, JSON.stringify(logEntry));
      await redis.ltrim(`logs:${hostname}`, 0, 99);
    }

    logger.info(`Hostname updated: ${hostname} by user ${userId}`);

    res.json(updatedHostname);

  } catch (error) {
    logger.error('Update hostname error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete hostname
router.delete('/hostnames/:hostname', authMiddleware, async (req, res) => {
  try {
    const hostname = req.params.hostname;
    const userId = req.user.userId;

    // Get existing hostname
    const existingData = await redis.get(`hostname:${hostname}`);
    if (!existingData) {
      return res.status(404).json({ error: 'Hostname not found' });
    }

    const existingHostname = JSON.parse(existingData);
    if (existingHostname.userId !== userId) {
      return res.status(403).json({ error: 'Hostname does not belong to you' });
    }

    // Delete hostname
    await redis.del(`hostname:${hostname}`);
    await redis.srem(`user_hostnames:${userId}`, hostname);
    await redis.del(`logs:${hostname}`);

    logger.info(`Hostname deleted: ${hostname} by user ${userId}`);

    res.json({ success: true, message: 'Hostname deleted' });

  } catch (error) {
    logger.error('Delete hostname error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get hostname logs
router.get('/hostnames/:hostname/logs', authMiddleware, async (req, res) => {
  try {
    const hostname = req.params.hostname;
    const userId = req.user.userId;

    // Check if hostname belongs to user
    const hostnameData = await redis.get(`hostname:${hostname}`);
    if (!hostnameData) {
      return res.status(404).json({ error: 'Hostname not found' });
    }

    const hostnameInfo = JSON.parse(hostnameData);
    if (hostnameInfo.userId !== userId) {
      return res.status(403).json({ error: 'Hostname does not belong to you' });
    }

    // Get logs
    const logs = await redis.lrange(`logs:${hostname}`, 0, 49); // Last 50 logs
    const parsedLogs = logs.map(log => JSON.parse(log));

    res.json(parsedLogs);

  } catch (error) {
    logger.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke API token
router.delete('/tokens/:tokenId', authMiddleware, async (req, res) => {
  try {
    const tokenId = req.params.tokenId;
    const userId = req.user.userId;

    // Check if token belongs to user
    const tokenData = await redis.get(`token:${tokenId}`);
    if (!tokenData) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const tokenInfo = JSON.parse(tokenData);
    if (tokenInfo.userId !== userId) {
      return res.status(403).json({ error: 'Token does not belong to you' });
    }

    // Delete token
    await redis.del(`token:${tokenId}`);

    logger.info(`API token revoked: ${tokenId} by user ${userId}`);

    res.json({ success: true, message: 'Token revoked' });

  } catch (error) {
    logger.error('Token revocation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;