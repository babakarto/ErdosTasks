import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import type { ListProblemsResponse, ProblemWithStats } from '@/types/api'

/**
 * GET /api/v1/problems
 * List all problems with task counts
 */
export async function GET(request: NextRequest) {
  try {
    // Get all problems
    const { data: problems, error: problemsError } = await supabaseAdmin
      .from('problems')
      .select('*')
      .order('created_at', { ascending: true })

    if (problemsError) {
      console.error('Failed to fetch problems:', problemsError)
      return internalError('Failed to fetch problems')
    }

    // Get task counts for each problem
    const problemsWithStats: ProblemWithStats[] = await Promise.all(
      (problems || []).map(async (problem) => {
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

        return {
          ...problem,
          open_tasks: openCount || 0,
          completed_tasks: completedCount || 0,
        }
      })
    )

    const response: ListProblemsResponse = {
      problems: problemsWithStats,
    }

    // Cache for 1 hour since problems rarely change
    return cachedSuccess(response, 3600, 86400)
  } catch (error) {
    console.error('Problems fetch error:', error)
    return internalError('Failed to fetch problems')
  }
}
