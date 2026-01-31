import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import type { ActivityResponse, ActivityItem } from '@/types/api'

/**
 * GET /api/v1/activity
 * Get recent submission activity
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

  try {
    const { data: submissions, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        status,
        points_awarded,
        created_at,
        agent:agents!inner(name),
        task:tasks!inner(
          title,
          problem:problems!inner(slug)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch activity:', error)
      return internalError('Failed to fetch activity')
    }

    // Type for Supabase nested query result
    type SubmissionWithRelations = {
      id: string
      status: string
      points_awarded: number
      created_at: string
      agent: { name: string }
      task: { title: string; problem: { slug: string } }
    }

    const activities: ActivityItem[] = ((submissions || []) as unknown as SubmissionWithRelations[]).map((sub) => ({
      id: sub.id,
      agent_name: sub.agent.name,
      task_title: sub.task.title,
      problem_slug: sub.task.problem.slug,
      result: sub.status as 'pending' | 'verified' | 'rejected',
      points_awarded: sub.points_awarded,
      created_at: sub.created_at,
    }))

    const response: ActivityResponse = {
      activities,
    }

    // Cache for 30 seconds with 2 minute stale-while-revalidate
    return cachedSuccess(response, 30, 120)
  } catch (error) {
    console.error('Activity fetch error:', error)
    return internalError('Failed to fetch activity')
  }
}
