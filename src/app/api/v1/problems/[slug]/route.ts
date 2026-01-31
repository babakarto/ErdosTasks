import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { notFound, internalError } from '@/lib/api/errors'
import type { ProblemDetailResponse } from '@/types/api'

/**
 * GET /api/v1/problems/[slug]
 * Get details for a specific problem
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

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

    // Cache for 1 hour since problem details rarely change
    return cachedSuccess(response, 3600, 86400)
  } catch (error) {
    console.error('Problem fetch error:', error)
    return internalError('Failed to fetch problem')
  }
}
