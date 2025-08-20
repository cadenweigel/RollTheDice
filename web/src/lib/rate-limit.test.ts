import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { checkRateLimit, RATE_LIMITS, RateLimitConfig } from './rate-limit'

// Mock NextRequest for testing
function createMockRequest(ip: string = '127.0.0.1'): NextRequest {
  const headers = new Map()
  headers.set('x-forwarded-for', ip)
  
  return {
    headers: {
      get: (name: string) => headers.get(name),
    },
    ip: ip,
  } as unknown as NextRequest
}

describe('Rate Limiting', () => {
  // Note: Rate limiting tests use different IP addresses to avoid conflicts
  // In a real implementation, we'd need to expose a way to clear the store

  describe('checkRateLimit', () => {
    it('should allow requests within limits', () => {
      const req = createMockRequest('192.168.1.100')
      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 1000,
      }

      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(req, config)
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('should block requests exceeding limits', () => {
      const req = createMockRequest('192.168.1.101')
      const config: RateLimitConfig = {
        maxRequests: 3,
        windowMs: 1000,
      }

      // Make 3 requests (at limit)
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(req, config)
        expect(result.success).toBe(true)
      }

      // 4th request should be blocked
      const result = checkRateLimit(req, config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
    })

    it('should track different IPs separately', () => {
      const req1 = createMockRequest('192.168.1.1')
      const req2 = createMockRequest('192.168.1.2')
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 1000,
      }

      // Both IPs should be able to make 2 requests
      expect(checkRateLimit(req1, config).success).toBe(true)
      expect(checkRateLimit(req1, config).success).toBe(true)
      expect(checkRateLimit(req2, config).success).toBe(true)
      expect(checkRateLimit(req2, config).success).toBe(true)

      // Both should now be blocked
      expect(checkRateLimit(req1, config).success).toBe(false)
      expect(checkRateLimit(req2, config).success).toBe(false)
    })

    it('should reset after window expires', () => {
      const req = createMockRequest('192.168.1.102')
      const config: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 100, // Very short window for testing
      }

      // Make 2 requests
      expect(checkRateLimit(req, config).success).toBe(true)
      expect(checkRateLimit(req, config).success).toBe(true)

      // Should be blocked
      expect(checkRateLimit(req, config).success).toBe(false)

      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          const result = checkRateLimit(req, config)
          expect(result.success).toBe(true)
          resolve(undefined)
        }, 150)
      })
    })
  })

  describe('RATE_LIMITS configuration', () => {
    it('should have reasonable limits', () => {
      expect(RATE_LIMITS.GENERAL.maxRequests).toBe(100)
      expect(RATE_LIMITS.GENERAL.windowMs).toBe(60 * 1000)

      expect(RATE_LIMITS.CREATE_GAME.maxRequests).toBe(10)
      expect(RATE_LIMITS.CREATE_GAME.windowMs).toBe(60 * 60 * 1000)

      expect(RATE_LIMITS.ROLL_DICE.maxRequests).toBe(60)
      expect(RATE_LIMITS.ROLL_DICE.windowMs).toBe(60 * 1000)

      expect(RATE_LIMITS.FINISH_GAME.maxRequests).toBe(20)
      expect(RATE_LIMITS.FINISH_GAME.windowMs).toBe(60 * 1000)

      expect(RATE_LIMITS.READ_ONLY.maxRequests).toBe(200)
      expect(RATE_LIMITS.READ_ONLY.windowMs).toBe(60 * 1000)
    })

    it('should have appropriate limits for different operations', () => {
      // Game creation should be more restrictive
      expect(RATE_LIMITS.CREATE_GAME.maxRequests).toBeLessThan(RATE_LIMITS.GENERAL.maxRequests)
      
      // Read operations should have higher limits
      expect(RATE_LIMITS.READ_ONLY.maxRequests).toBeGreaterThan(RATE_LIMITS.GENERAL.maxRequests)
      
      // Rolling should allow reasonable gameplay
      expect(RATE_LIMITS.ROLL_DICE.maxRequests).toBeGreaterThanOrEqual(30)
    })
  })
}) 