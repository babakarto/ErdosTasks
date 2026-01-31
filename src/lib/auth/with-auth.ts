// Higher-order function for protected API routes
// Wraps route handlers to require authentication

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, type AuthResult } from './middleware'
import { unauthorized } from '@/lib/api/errors'
import type { Agent } from '@/types/database'

export interface AuthenticatedRequest extends NextRequest {
  agent: Agent
}

type RouteHandler<T = unknown> = (
  request: NextRequest,
  context: { params: Record<string, string>; agent: Agent }
) => Promise<NextResponse<T>>

/**
 * Wrap a route handler to require authentication.
 * The agent object is passed to the handler in the context.
 */
export function withAuth<T = unknown>(
  handler: RouteHandler<T>
): (request: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse<T>> {
  return async (request: NextRequest, context: { params: Record<string, string> }) => {
    const authResult: AuthResult = await validateApiKey(request)

    if (!authResult.valid || !authResult.agent) {
      return unauthorized(authResult.error) as NextResponse<T>
    }

    return handler(request, { ...context, agent: authResult.agent })
  }
}
