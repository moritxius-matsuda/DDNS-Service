import { NextResponse } from 'next/server'
import { getHostnameIP } from '../../../../lib/redis'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const hostname = searchParams.get('hostname')

    if (!hostname) {
      return NextResponse.json({ error: 'Hostname is required' }, { status: 400 })
    }

    const hostnameData = await getHostnameIP(hostname)
    
    if (!hostnameData) {
      return NextResponse.json({ error: 'Hostname not found' }, { status: 404 })
    }

    return NextResponse.json({
      hostname: `${hostname}.dm1lx.de`,
      ip: hostnameData.ip,
      lastUpdated: hostnameData.lastUpdated
    })
  } catch (error) {
    console.error('Error resolving hostname:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}