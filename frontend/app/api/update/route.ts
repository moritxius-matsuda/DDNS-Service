import { NextResponse } from "next/server";
import { createClient } from "redis";

// Create Redis client only on server side
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://default:qUDOoKa6WE6zgtiEU59VHsnGxxX3dJPC@redis-19438.c300.eu-central-1-1.ec2.redns.redis-cloud.com:19438"
});

redisClient.on('error', (err: Error) => {
  console.error('Redis Client Error', err);
});

// Connect to Redis when the module loads
redisClient.connect().catch(console.error);

export async function POST(request: Request) {
  try {
    const { hostname, ipAddress } = await request.json();
    
    if (!hostname || !ipAddress) {
      return NextResponse.json(
        { error: "Hostname and IP address are required" },
        { status: 400 }
      );
    }

    // Validate hostname format
    if (!hostname.endsWith(".dm1lx.de")) {
      return NextResponse.json(
        { error: "Hostname must end with .dm1lx.de" },
        { status: 400 }
      );
    }

    // Store in Redis
    await redisClient.set(hostname, ipAddress);
    await redisClient.set(`${hostname}:last_update`, Date.now().toString());

    return NextResponse.json({
      success: true,
      hostname,
      ipAddress,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error updating DDNS:", error);
    return NextResponse.json(
      { error: "Failed to update DDNS record" },
      { status: 500 }
    );
  }
}
