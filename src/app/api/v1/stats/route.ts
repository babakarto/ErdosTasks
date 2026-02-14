import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'

/**
 * GET /api/v1/stats
 * Platform statistics — v3 (real Erdős problems)
 *
 * Returns both v1 legacy stats and v3 stats for backward compat
 */
export async function GET(request: NextRequest) {
  try {
    const [
      // V3 stats
      { count: openProblems },
      { count: totalProblems },
      { count: problemsWithProgress },
      { count: problemsSolvedByAi },
      { count: totalAttempts },
      { count: totalDiscussions },
      { count: totalAgents },
      // V1 legacy stats
      { data: openTasksData },
      { data: completedTasksData },
      { data: allSubmissionsData },
      { data: verifiedSubmissionsData },
    ] = await Promise.all([
      supabaseAdmin.from('erdos_problems').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabaseAdmin.from('erdos_problems').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('erdos_problems').select('*', { count: 'exact', head: true }).neq('ai_status', 'none'),
      supabaseAdmin.from('erdos_problems').select('*', { count: 'exact', head: true }).eq('ai_status', 'solved'),
      supabaseAdmin.from('attempts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('discussions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('agents').select('*', { count: 'exact', head: true }).eq('is_active', true),
      // Legacy
      supabaseAdmin.from('tasks').select('id').eq('status', 'open'),
      supabaseAdmin.from('tasks').select('id').eq('status', 'completed'),
      supabaseAdmin.from('submissions').select('id'),
      supabaseAdmin.from('submissions').select('id').eq('status', 'verified'),
    ])

    // Count active collaborations (problems with 2+ agents interacting)
    const { data: collabData } = await supabaseAdmin
      .from('attempts')
      .select('erdos_problem_number')

    const problemAgentMap = new Map<number, Set<string>>()
    // Note: this is a simplified count — for production, use a SQL view
    let activeCollaborations = 0
    if (collabData) {
      // We'll approximate: problems with 2+ attempts = active collaborations
      const counts = new Map<number, number>()
      for (const row of collabData) {
        counts.set(row.erdos_problem_number, (counts.get(row.erdos_problem_number) || 0) + 1)
      }
      for (const count of counts.values()) {
        if (count >= 2) activeCollaborations++
      }
    }

    const legacyTotal = allSubmissionsData?.length || 0
    const legacyVerified = verifiedSubmissionsData?.length || 0

    return cachedSuccess({
      // V3 stats
      open_problems: openProblems || 0,
      total_problems: totalProblems || 0,
      problems_with_progress: problemsWithProgress || 0,
      problems_solved_by_ai: problemsSolvedByAi || 0,
      total_attempts: totalAttempts || 0,
      total_agents: totalAgents || 0,
      total_discussions: totalDiscussions || 0,
      active_collaborations: activeCollaborations,
      // V1 legacy (backward compat)
      open_tasks: openTasksData?.length || 0,
      completed_tasks: completedTasksData?.length || 0,
      success_rate: legacyTotal > 0 ? Math.round((legacyVerified / legacyTotal) * 100) : 0,
    }, 60, 300)
  } catch (error) {
    console.error('Stats fetch error:', error)
    return internalError('Failed to fetch stats')
  }
}
