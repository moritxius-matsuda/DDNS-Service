const express = require('express');
const { redis } = require('../server');
const logger = require('../utils/logger');
const authMiddleware = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const updateIpSchema = Joi.object({
  hostname: Joi.string().hostname().required(),
  ip: Joi.string().ip({ version: ['ipv4'] }).required()
});

// DDNS Update endpoint - used by routers/scripts
router.post('/update', authMiddleware, async (req, res) => {
  try {
    const { error, value } = updateIpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details[0].message 
      });
    }

    const { hostname, ip } = value;
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

    // Update IP address
    const updatedHostname = {
      ...hostnameInfo,
      ip: ip,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'api'
    };

    await redis.set(`hostname:${hostname}`, JSON.stringify(updatedHostname));

    // Log the IP change
    const logEntry = {
      hostname,
      oldIp: hostnameInfo.ip,
      newIp: ip,
      timestamp: new Date().toISOString(),
      updatedBy: 'api',
      userAgent: req.headers['user-agent'] || 'Unknown'
    };

    await redis.lpush(`logs:${hostname}`, JSON.stringify(logEntry));
    await redis.ltrim(`logs:${hostname}`, 0, 99); // Keep last 100 logs

    logger.info(`IP updated for ${hostname}: ${hostnameInfo.ip} -> ${ip} by user ${userId}`);

    res.json({
      success: true,
      hostname,
      ip,
      lastUpdated: updatedHostname.lastUpdated
    });

  } catch (error) {
    logger.error('DDNS update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DNS Resolution endpoint - handles *.dm1lx.de requests
router.get('/:hostname', async (req, res) => {
  try {
    const hostname = req.params.hostname;
    
    // Remove .dm1lx.de suffix if present
    const cleanHostname = hostname.replace(/\.dm1lx\.de$/, '');
    
    const hostnameData = await redis.get(`hostname:${cleanHostname}`);
    if (!hostnameData) {
      return res.status(404).json({ error: 'Hostname not found' });
    }

    const hostnameInfo = JSON.parse(hostnameData);
    
    // Return IP address for DNS resolution
    res.json({
      hostname: cleanHostname,
      ip: hostnameInfo.ip,
      ttl: hostnameInfo.ttl || 300,
      lastUpdated: hostnameInfo.lastUpdated
    });

  } catch (error) {
    logger.error('DNS resolution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get hostname info (for debugging)
router.get('/info/:hostname', authMiddleware, async (req, res) => {
  try {
    const hostname = req.params.hostname;
    const userId = req.user.userId;

    const hostnameData = await redis.get(`hostname:${hostname}`);
    if (!hostnameData) {
      return res.status(404).json({ error: 'Hostname not found' });
    }

    const hostnameInfo = JSON.parse(hostnameData);
    if (hostnameInfo.userId !== userId) {
      return res.status(403).json({ error: 'Hostname does not belong to you' });
    }

    res.json(hostnameInfo);

  } catch (error) {
    logger.error('Hostname info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;