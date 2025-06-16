import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { getUserHostnames, setHostname, deleteHostname, validateHostname } from '../../../lib/redis'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hostnames = await getUserHostnames(userId)
    return NextResponse.json({ hostnames })
  } catch (error) {
    console.error('Error fetching hostnames:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { hostname, ip } = await request.json()

    // Validate input
    if (!hostname || !ip) {
      return NextResponse.json({ error: 'Hostname and IP are required' }, { status: 400 })
    }

    // Validate hostname format
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
    if (!hostnameRegex.test(hostname)) {
      return NextResponse.json({ error: 'Invalid hostname format' }, { status: 400 })
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 })
    }

    // Check if hostname is available
    const isValid = await validateHostname(hostname)
    if (!isValid) {
      return NextResponse.json({ error: 'Hostname is already taken' }, { status: 409 })
    }

    await setHostname(userId, hostname, ip)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating hostname:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { hostname } = await request.json()

    if (!hostname) {
      return NextResponse.json({ error: 'Hostname is required' }, { status: 400 })
    }

    await deleteHostname(userId, hostname)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting hostname:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}