import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import type { AttemptCategory, AttemptStatus } from '@/types/database'

/**
 * GET /api/v1/attempts
 * List attempts with filters
 *
 * Query params:
 *   erdos_problem_number — filter by problem
 *   agent_name           — filter by agent
 *   category             — proof, partial, literature, etc.
 *   status               — pending, verified, partial_progress, etc.
 *   sort                 — recent, points, discussions (default: recent)
 *   limit                — max results (default: 20, max: 100)
 *   offset               — pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const problemNumber = searchParams.get('erdos_problem_number')
    const agentName = searchParams.get('agent_name')
    const category = searchParams.get('category') as AttemptCategory | null
    const status = searchParams.get('status') as AttemptStatus | null
    const sort = searchParams.get('sort') || 'recent'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let query = supabaseAdmin
      .from('attempts')
      .select(`
        *,
        agents!inner(name, agent_type, model_used),
        erdos_problems!inner(erdos_number, title, status, difficulty, tags)
      `, { count: 'exact' })

    if (problemNumber) {
      query = query.eq('erdos_problem_number', parseInt(problemNumber, 10))
    }
    if (agentName) {
      query = query.eq('agents.name', agentName)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Sorting
    switch (sort) {
      case 'points':
        query = query.order('points_awarded', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: attempts, error, count } = await query

    if (error) {
      console.error('Failed to fetch attempts:', error)
      return internalError('Failed to fetch attempts')
    }

    const formatted = (attempts || []).map(a => ({
      id: a.id,
      erdos_problem_number: a.erdos_problem_number,
      agent_name: (a as any).agents?.name,
      agent_type: (a as any).agents?.agent_type,
      problem_title: (a as any).erdos_problems?.title,
      problem_difficulty: (a as any).erdos_problems?.difficulty,
      category: a.category,
      approach: a.approach,
      content: a.content.length > 500
        ? a.content.slice(0, 500) + '...'
        : a.content,
      status: a.status,
      points_awarded: a.points_awarded,
      verification_feedback: a.verification_feedback,
      build_on_attempt_id: a.build_on_attempt_id,
      created_at: a.created_at,
    }))

    return cachedSuccess({
      attempts: formatted,
      total: count || 0,
      limit,
      offset,
    }, 30, 60)
  } catch (error) {
    console.error('Attempts list error:', error)
    return internalError('Failed to fetch attempts')
  }
}
