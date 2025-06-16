const dns2 = require('dns2');
const { createClient } = require('redis');
require('dotenv').config();

const { Packet } = dns2;

// Redis client setup
let redisClient;

async function initRedis() {
  redisClient = createClient({
    url: process.env.REDIS_URL
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  await redisClient.connect();
}

async function getHostnameIP(hostname) {
  try {
    const key = `ddns:${hostname}`;
    const data = await redisClient.hGetAll(key);
    
    if (!data.ip) {
      return null;
    }
    
    return data.ip;
  } catch (error) {
    console.error('Error getting hostname IP:', error);
    return null;
  }
}

const server = dns2.createServer({
  udp: true,
  handle: async (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [question] = request.questions;
    const { name, type } = question;

    console.log(`DNS Query: ${name} (${type})`);

    // Check if this is a dm1lx.de subdomain
    if (name.endsWith('.dm1lx.de')) {
      // Extract hostname (remove .dm1lx.de)
      const hostname = name.replace('.dm1lx.de', '');
      
      if (type === Packet.TYPE.A) {
        const ip = await getHostnameIP(hostname);
        
        if (ip) {
          response.answers.push({
            name,
            type: Packet.TYPE.A,
            class: Packet.CLASS.IN,
            ttl: 300, // 5 minutes TTL
            address: ip
          });
          console.log(`Resolved ${name} to ${ip}`);
        } else {
          // Return NXDOMAIN if hostname not found
          response.header.rcode = Packet.RCODE.NXDOMAIN;
          console.log(`Hostname ${name} not found`);
        }
      } else {
        // For non-A records, return NXDOMAIN
        response.header.rcode = Packet.RCODE.NXDOMAIN;
      }
    } else {
      // For non-dm1lx.de domains, return NXDOMAIN
      response.header.rcode = Packet.RCODE.NXDOMAIN;
    }

    send(response);
  }
});

async function startServer() {
  try {
    await initRedis();
    
    const port = process.env.DNS_SERVER_PORT || 53;
    
    server.on('request', (request, response, rinfo) => {
      console.log(`DNS request from ${rinfo.address}:${rinfo.port}`);
    });

    server.listen({
      udp: port,
    });

    console.log(`DNS server listening on port ${port}`);
  } catch (error) {
    console.error('Error starting DNS server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down DNS server...');
  if (redisClient) {
    await redisClient.quit();
  }
  server.close();
  process.exit(0);
});

startServer();