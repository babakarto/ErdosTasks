import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success, cachedSuccess } from '@/lib/api/responses'
import { notFound, internalError } from '@/lib/api/errors'
import type { ProblemDetailResponse } from '@/types/api'

/**
 * GET /api/v1/problems/:slug
 *
 * Handles both:
 * - V1 legacy: slug string (e.g. "erdos-straus") → queries `problems` table
 * - V3: numeric Erdős number (e.g. "652") → queries `erdos_problems` table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // If the slug is a number, use v3 Erdős problem lookup
  const num = parseInt(slug, 10)
  if (!isNaN(num) && String(num) === slug) {
    return getErdosProblem(num)
  }

  // Otherwise, v1 legacy problem lookup
  return getLegacyProblem(slug)
}

/**
 * V3: Get Erdős problem by number
 */
async function getErdosProblem(num: number) {
  try {
    const { data: problem, error } = await supabaseAdmin
      .from('erdos_problems')
      .select('*')
      .eq('erdos_number', num)
      .single()

    if (error || !problem) {
      return notFound(`Erdős problem #${num} not found`)
    }

    // Fetch recent attempts with agent info
    const { data: attempts } = await supabaseAdmin
      .from('attempts')
      .select('*, agents!inner(name, agent_type, model_used)')
      .eq('erdos_problem_number', num)
      .order('created_at', { ascending: false })
      .limit(20)

    // Count active agents on this problem
    const { count: activeAgents } = await supabaseAdmin
      .from('attempts')
      .select('agent_id', { count: 'exact', head: true })
      .eq('erdos_problem_number', num)

    // Count discussions on this problem's attempts
    const attemptIds = (attempts || []).map(a => a.id)
    let collaborationCount = 0
    if (attemptIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('discussions')
        .select('*', { count: 'exact', head: true })
        .in('attempt_id', attemptIds)
      collaborationCount = count || 0
    }

    return success({
      ...problem,
      recent_attempts: (attempts || []).map(a => ({
        id: a.id,
        agent_name: (a as any).agents?.name,
        agent_type: (a as any).agents?.agent_type,
        category: a.category,
        approach: a.approach,
        status: a.status,
        points_awarded: a.points_awarded,
        build_on_attempt_id: a.build_on_attempt_id,
        created_at: a.created_at,
      })),
      active_agents: activeAgents || 0,
      collaboration_count: collaborationCount,
    })
  } catch (error) {
    console.error('Problem detail error:', error)
    return internalError()
  }
}

/**
 * V1 legacy: Get problem by slug
 */
async function getLegacyProblem(slug: string) {
  try {
    const { data: problem, error } = await supabaseAdmin
      .from('problems')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !problem) {
      return notFound(`Problem '${slug}' not found`)
    }

    // Get task counts
    const { count: openCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('problem_id', problem.id)
      .eq('status', 'open')

    const { count: completedCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('problem_id', problem.id)
      .eq('status', 'completed')

    const response: ProblemDetailResponse = {
      ...problem,
      open_tasks: openCount || 0,
      completed_tasks: completedCount || 0,
    }

    return cachedSuccess(response, 3600, 86400)
  } catch (error) {
    console.error('Problem fetch error:', error)
    return internalError('Failed to fetch problem')
  }
}
