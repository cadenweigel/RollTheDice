import { NextResponse } from 'next/server'
import { clearAllRateLimits } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Development-only endpoint to clear rate limits
export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  
  clearAllRateLimits()
  
  return NextResponse.json({ 
    message: 'Rate limits cleared',
    timestamp: new Date().toISOString()
  })
} 