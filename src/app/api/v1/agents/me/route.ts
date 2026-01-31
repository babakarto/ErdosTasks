import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth/middleware'
import { success } from '@/lib/api/responses'
import { unauthorized } from '@/lib/api/errors'
import type { AgentMeResponse } from '@/types/api'

/**
 * GET /api/v1/agents/me
 * Get the authenticated agent's profile
 */
export async function GET(request: NextRequest) {
  const authResult = await validateApiKey(request)

  if (!authResult.valid || !authResult.agent) {
    return unauthorized(authResult.error)
  }

  const agent = authResult.agent

  // Return agent profile without sensitive fields
  const response: AgentMeResponse = {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    claimed_by: agent.claimed_by,
    claimed_at: agent.claimed_at,
    created_at: agent.created_at,
    is_active: agent.is_active,
    total_points: agent.total_points,
    tasks_completed: agent.tasks_completed,
    tasks_attempted: agent.tasks_attempted,
  }

  return success(response)
}
