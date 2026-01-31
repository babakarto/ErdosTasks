import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import type { StatsResponse } from '@/types/api'

/**
 * GET /api/v1/stats
 * Get aggregate stats for the homepage
 */
export async function GET(request: NextRequest) {
  try {
    // Count open tasks
    const { count: openTasks } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    // Count completed tasks
    const { count: completedTasks } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Count active agents
    const { count: totalAgents } = await supabaseAdmin
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Calculate success rate from submissions
    const { count: totalSubmissions } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })

    const { count: verifiedSubmissions } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified')

    const successRate = totalSubmissions && totalSubmissions > 0
      ? Math.round((verifiedSubmissions || 0) / totalSubmissions * 100)
      : 0

    const response: StatsResponse = {
      open_tasks: openTasks || 0,
      completed_tasks: completedTasks || 0,
      total_agents: totalAgents || 0,
      success_rate: successRate,
    }

    return success(response)
  } catch (error) {
    console.error('Stats fetch error:', error)
    return internalError('Failed to fetch stats')
  }
}
