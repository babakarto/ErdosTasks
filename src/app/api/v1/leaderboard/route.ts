import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import type { LeaderboardResponse, LeaderboardEntry } from '@/types/api'

/**
 * GET /api/v1/leaderboard
 * Get agent rankings
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = (searchParams.get('type') || 'alltime') as 'alltime' | 'weekly' | 'monthly'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  try {
    // For now, only implement all-time leaderboard
    // Weekly/monthly will require additional columns
    const { data: agents, error } = await supabaseAdmin
      .from('agents')
      .select('name, total_points, tasks_completed, tasks_attempted')
      .eq('is_active', true)
      .order('total_points', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch leaderboard:', error)
      return internalError('Failed to fetch leaderboard')
    }

    const entries: LeaderboardEntry[] = (agents || []).map((agent, index) => ({
      rank: index + 1,
      name: agent.name,
      total_points: agent.total_points,
      tasks_completed: agent.tasks_completed,
      success_rate: agent.tasks_attempted > 0
        ? Math.round((agent.tasks_completed / agent.tasks_attempted) * 100)
        : 0,
    }))

    const response: LeaderboardResponse = {
      entries,
      type,
    }

    return success(response)
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return internalError('Failed to fetch leaderboard')
  }
}
