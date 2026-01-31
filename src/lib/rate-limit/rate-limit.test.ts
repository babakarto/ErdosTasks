import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkRateLimit,
  resetRateLimitStore,
  RATE_LIMIT_CONFIG,
} from './index'

describe('Rate Limiting', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  describe('checkRateLimit', () => {
    it('should allow first request for a new key', () => {
      const result = checkRateLimit('test-key-1')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(RATE_LIMIT_CONFIG.maxRequests - 1)
      expect(result.limit).toBe(RATE_LIMIT_CONFIG.maxRequests)
      expect(result.reset).toBeGreaterThan(0)
    })

    it('should track request count within window', () => {
      const key = 'test-key-2'

      // First request
      let result = checkRateLimit(key)
      expect(result.remaining).toBe(99)

      // Second request
      result = checkRateLimit(key)
      expect(result.remaining).toBe(98)

      // Third request
      result = checkRateLimit(key)
      expect(result.remaining).toBe(97)
    })

    it('should allow up to 100 requests per minute', () => {
      const key = 'test-key-3'

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        const result = checkRateLimit(key)
        expect(result.allowed).toBe(true)
      }
    })

    it('should reject the 101st request', () => {
      const key = 'test-key-4'

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        checkRateLimit(key)
      }

      // 101st request should be rejected
      const result = checkRateLimit(key)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should track different keys separately', () => {
      const key1 = 'agent-key-1'
      const key2 = 'agent-key-2'

      // Make 50 requests for key1
      for (let i = 0; i < 50; i++) {
        checkRateLimit(key1)
      }

      // key2 should still have full quota
      const result = checkRateLimit(key2)
      expect(result.remaining).toBe(99)
    })

    it('should return correct reset time', () => {
      const result = checkRateLimit('test-key-5')

      // Reset time should be approximately 60 seconds
      expect(result.reset).toBeGreaterThanOrEqual(59)
      expect(result.reset).toBeLessThanOrEqual(60)
    })

    it('should maintain remaining count at 0 when exceeded', () => {
      const key = 'test-key-6'

      // Exceed the limit
      for (let i = 0; i < 110; i++) {
        checkRateLimit(key)
      }

      // Check remaining stays at 0
      const result = checkRateLimit(key)
      expect(result.remaining).toBe(0)
      expect(result.allowed).toBe(false)
    })
  })

  describe('configuration', () => {
    it('should have correct default limits', () => {
      expect(RATE_LIMIT_CONFIG.windowMs).toBe(60 * 1000) // 1 minute
      expect(RATE_LIMIT_CONFIG.maxRequests).toBe(100) // 100 requests
    })
  })
})
