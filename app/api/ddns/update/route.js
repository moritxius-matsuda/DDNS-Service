import { NextResponse } from 'next/server'
import { validateApiKey, setHostname, getHostnameIP } from '../../../../lib/redis'

export async function POST(request) {
  try {
    const { hostname, apiKey, ip } = await request.json()

    // Validate input
    if (!hostname || !apiKey) {
      return NextResponse.json({ error: 'Hostname and API key are required' }, { status: 400 })
    }

    // Validate API key
    const userId = await validateApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Get IP from request if not provided
    let clientIP = ip
    if (!clientIP) {
      // Get client IP from headers
      const forwarded = request.headers.get('x-forwarded-for')
      const realIP = request.headers.get('x-real-ip')
      clientIP = forwarded ? forwarded.split(',')[0] : realIP || '127.0.0.1'
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(clientIP)) {
      return NextResponse.json({ error: 'Invalid IP address' }, { status: 400 })
    }

    // Check if hostname exists and belongs to user
    const existingHostname = await getHostnameIP(hostname)
    if (!existingHostname) {
      return NextResponse.json({ error: 'Hostname not found' }, { status: 404 })
    }

    if (existingHostname.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update hostname
    await setHostname(userId, hostname, clientIP)

    return NextResponse.json({ 
      success: true, 
      hostname: `${hostname}.dm1lx.de`,
      ip: clientIP,
      updated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating DDNS:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const hostname = searchParams.get('hostname')
    const apiKey = searchParams.get('apiKey')
    const ip = searchParams.get('ip')

    if (!hostname || !apiKey) {
      return NextResponse.json({ error: 'Hostname and API key are required' }, { status: 400 })
    }

    // Validate API key
    const userId = await validateApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Get IP from request if not provided
    let clientIP = ip
    if (!clientIP) {
      const forwarded = request.headers.get('x-forwarded-for')
      const realIP = request.headers.get('x-real-ip')
      clientIP = forwarded ? forwarded.split(',')[0] : realIP || '127.0.0.1'
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(clientIP)) {
      return NextResponse.json({ error: 'Invalid IP address' }, { status: 400 })
    }

    // Check if hostname exists and belongs to user
    const existingHostname = await getHostnameIP(hostname)
    if (!existingHostname) {
      return NextResponse.json({ error: 'Hostname not found' }, { status: 404 })
    }

    if (existingHostname.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update hostname
    await setHostname(userId, hostname, clientIP)

    return NextResponse.json({ 
      success: true, 
      hostname: `${hostname}.dm1lx.de`,
      ip: clientIP,
      updated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating DDNS:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}