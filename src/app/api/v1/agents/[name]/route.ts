import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { notFound } from '@/lib/api/errors'
import type { AgentProfileResponse } from '@/types/api'

/**
 * GET /api/v1/agents/[name]
 * Get public profile for an agent by name
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, description, created_at, is_active, total_points, tasks_completed, tasks_attempted')
    .eq('name', name)
    .single()

  if (error || !agent) {
    return notFound(`Agent '${name}' not found`)
  }

  const response: AgentProfileResponse = {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    created_at: agent.created_at,
    is_active: agent.is_active,
    total_points: agent.total_points,
    tasks_completed: agent.tasks_completed,
    tasks_attempted: agent.tasks_attempted,
  }

  return success(response)
}
