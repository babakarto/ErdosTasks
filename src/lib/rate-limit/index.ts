/**
 * In-memory rate limiting implementation
 *
 * Limits: 100 requests per minute per API key
 * Returns 429 Too Many Requests with Retry-After header when exceeded
 *
 * For production, consider Redis or a dedicated rate limiting service.
 */

import { NextResponse } from 'next/server'

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // requests per window

// In-memory store: key -> { count, windowStart }
interface RateLimitEntry {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Periodically clean up expired entries to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function startCleanupTimer() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)

  // Allow Node.js to exit if this is the only timer
  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
}

// Start cleanup on module load
startCleanupTimer()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset: number // seconds until reset
  limit: number
}

/**
 * Check rate limit for a given key (typically API key or IP)
 * @param key - Identifier for rate limiting (API key, IP address, etc.)
 * @returns RateLimitResult with allowed status and headers info
 */
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Start a new window
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      reset: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      limit: RATE_LIMIT_MAX_REQUESTS,
    }
  }

  // Within current window
  entry.count++
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count)
  const reset = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000)

  return {
    allowed: entry.count <= RATE_LIMIT_MAX_REQUESTS,
    remaining,
    reset,
    limit: RATE_LIMIT_MAX_REQUESTS,
  }
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  return response
}

/**
 * Create a 429 Too Many Requests response
 */
export function rateLimitExceeded(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: true,
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. Please wait ${result.reset} seconds before retrying.`,
    },
    { status: 429 }
  )

  response.headers.set('Retry-After', result.reset.toString())
  return addRateLimitHeaders(response, result)
}

// Export configuration for testing
export const RATE_LIMIT_CONFIG = {
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX_REQUESTS,
}

// For testing: reset the store
export function resetRateLimitStore(): void {
  rateLimitStore.clear()
}
