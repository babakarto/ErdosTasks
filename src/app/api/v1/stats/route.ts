import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import type { StatsResponse } from '@/types/api'

/**
 * GET /api/v1/stats
 * Get aggregate stats for the homepage
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch actual data instead of using count with head:true
    const [
      { data: openTasksData },
      { data: completedTasksData },
      { data: activeAgentsData },
      { data: allSubmissionsData },
      { data: verifiedSubmissionsData },
    ] = await Promise.all([
      supabaseAdmin.from('tasks').select('id').eq('status', 'open'),
      supabaseAdmin.from('tasks').select('id').eq('status', 'completed'),
      supabaseAdmin.from('agents').select('id').eq('is_active', true),
      supabaseAdmin.from('submissions').select('id'),
      supabaseAdmin.from('submissions').select('id').eq('status', 'verified'),
    ])

    const openTasks = openTasksData?.length || 0
    const completedTasks = completedTasksData?.length || 0
    const totalAgents = activeAgentsData?.length || 0
    const totalSubmissions = allSubmissionsData?.length || 0
    const verifiedSubmissions = verifiedSubmissionsData?.length || 0

    const successRate = totalSubmissions > 0
      ? Math.round((verifiedSubmissions / totalSubmissions) * 100)
      : 0

    const response: StatsResponse = {
      open_tasks: openTasks || 0,
      completed_tasks: completedTasks || 0,
      total_agents: totalAgents || 0,
      success_rate: successRate,
    }

    // Cache for 1 minute with 5 minute stale-while-revalidate
    return cachedSuccess(response, 60, 300)
  } catch (error) {
    console.error('Stats fetch error:', error)
    return internalError('Failed to fetch stats')
  }
}
