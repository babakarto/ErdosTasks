/**
 * Higher-order function to apply rate limiting to API routes
 *
 * For authenticated routes: rate limits by API key
 * For public routes: rate limits by IP address
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey } from '@/lib/auth/middleware'
import { checkRateLimit, rateLimitExceeded, addRateLimitHeaders } from './index'

type RouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> } | { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

/**
 * Get the client identifier for rate limiting
 * Uses API key if present, otherwise falls back to IP address
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get API key first
  const apiKey = extractApiKey(request)
  if (apiKey) {
    return `api:${apiKey}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0].trim() || 'unknown'
  return `ip:${ip}`
}

/**
 * Wrap a route handler with rate limiting
 */
export function withRateLimit(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> } | { params: Promise<Record<string, string>> }) => {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(clientId)

    if (!rateLimitResult.allowed) {
      return rateLimitExceeded(rateLimitResult)
    }

    // Call the original handler
    const response = await handler(request, context)

    // Add rate limit headers to successful responses
    return addRateLimitHeaders(response, rateLimitResult)
  }
}

/**
 * Apply rate limiting directly (for use in route handlers)
 * Returns null if allowed, or a 429 response if rate limited
 */
export function applyRateLimit(request: NextRequest): NextResponse | null {
  const clientId = getClientIdentifier(request)
  const rateLimitResult = checkRateLimit(clientId)

  if (!rateLimitResult.allowed) {
    return rateLimitExceeded(rateLimitResult)
  }

  return null
}

/**
 * Get rate limit info for adding headers to a response
 */
export function getRateLimitInfo(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  return checkRateLimit(clientId)
}
