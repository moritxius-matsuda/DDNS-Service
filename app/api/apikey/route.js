import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { createApiKey } from '../../../lib/redis'
import { getRedisClient } from '../../../lib/redis'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const redis = await getRedisClient()
    const apiKey = await redis.get(`user:${userId}:apikey`)
    
    if (!apiKey) {
      // Create new API key if none exists
      const newApiKey = await createApiKey(userId)
      return NextResponse.json({ apiKey: newApiKey })
    }

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = await createApiKey(userId)
    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}