import { NextRequest } from 'next/server'

// Simple in-memory rate limiting (in production, use Redis or similar)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (req: NextRequest) => string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Default key generator using IP address
function defaultKeyGenerator(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  return `rate_limit:${ip}`
}

export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const key = (config.keyGenerator || defaultKeyGenerator)(req)
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }
  
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    }
  }
  
  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // General API requests
  GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Game creation
  CREATE_GAME: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // Dice rolling
  ROLL_DICE: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Game completion
  FINISH_GAME: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Leaderboard and stats (read-only, higher limits)
  READ_ONLY: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
  },
} as const

// Helper function to apply rate limiting to an API route
export function withRateLimit<T extends RateLimitConfig>(
  config: T,
  handler: (req: NextRequest, ...args: any[]) => Promise<Response>
) {
  return async (req: NextRequest, ...args: any[]) => {
    const rateLimitResult = checkRateLimit(req, config)
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter,
          limit: rateLimitResult.limit,
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            ...(rateLimitResult.retryAfter && {
              'Retry-After': rateLimitResult.retryAfter.toString(),
            }),
          },
        }
      )
    }
    
    // Add rate limit headers to successful responses
    const response = await handler(req, ...args)
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    
    return response
  }
} 