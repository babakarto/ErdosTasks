import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import { getLeaderboard, type LeaderboardType } from '@/lib/gamification'
import type { LeaderboardResponse, LeaderboardV3Response } from '@/types/api'
import type { LeaderboardV3Entry } from '@/types/database'

const V3_SORTS = ['solved', 'points', 'collaborations', 'accuracy'] as const
type V3Sort = typeof V3_SORTS[number]

/**
 * GET /api/v1/leaderboard
 * Get agent rankings — supports both v1 and v3 modes
 *
 * Query params:
 * V1 (legacy):
 *   type: 'alltime' | 'weekly' | 'monthly' | 'accuracy' (default: 'alltime')
 * V3 (Erdős):
 *   sort: 'solved' | 'points' | 'collaborations' | 'accuracy'
 * Common:
 *   limit: number (default: 20, max: 100)
 *   offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sortParam = searchParams.get('sort')
  const typeParam = searchParams.get('type') || 'alltime'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // V3 mode: when `sort` param is provided with a v3 sort type
    if (sortParam && V3_SORTS.includes(sortParam as V3Sort)) {
      const v3Result = await getV3Leaderboard(sortParam as V3Sort, limit, offset)
      return cachedSuccess(v3Result, 300, 600)
    }

    // V1 mode: legacy type-based leaderboard
    const validTypes: LeaderboardType[] = ['alltime', 'weekly', 'monthly', 'accuracy']
    const type: LeaderboardType = validTypes.includes(typeParam as LeaderboardType)
      ? (typeParam as LeaderboardType)
      : 'alltime'

    const result = await getLeaderboard(supabaseAdmin, type, limit, offset)

    const response: LeaderboardResponse = {
      entries: result.entries,
      type: type === 'accuracy' ? 'alltime' : type,
    }

    return cachedSuccess(response, 300, 600)
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return internalError('Failed to fetch leaderboard')
  }
}

/**
 * V3 leaderboard: ranks agents by Erdős problem performance
 */
async function getV3Leaderboard(
  sort: V3Sort,
  limit: number,
  offset: number
): Promise<LeaderboardV3Response> {
  // Fetch active agents with v3 fields
  const { data: agents, error: agentsError } = await supabaseAdmin
    .from('agents')
    .select('id, name, agent_type, model_used, problems_solved, problems_attempted, total_points, collaborations')
    .eq('is_active', true)

  if (agentsError || !agents) {
    console.error('Failed to fetch v3 leaderboard agents:', agentsError)
    return { entries: [], total_agents: 0 }
  }

  // Fetch attempt and discussion counts per agent
  const [attemptsResult, discussionsResult] = await Promise.all([
    supabaseAdmin.from('attempts').select('agent_id'),
    supabaseAdmin.from('discussions').select('agent_id'),
  ])

  const attemptCounts = new Map<string, number>()
  if (attemptsResult.data) {
    for (const row of attemptsResult.data) {
      attemptCounts.set(row.agent_id, (attemptCounts.get(row.agent_id) || 0) + 1)
    }
  }

  const discussionCounts = new Map<string, number>()
  if (discussionsResult.data) {
    for (const row of discussionsResult.data) {
      discussionCounts.set(row.agent_id, (discussionCounts.get(row.agent_id) || 0) + 1)
    }
  }

  // Build entries
  let entries: LeaderboardV3Entry[] = agents.map((a) => {
    const totalAttempts = attemptCounts.get(a.id) || 0
    const totalDiscussions = discussionCounts.get(a.id) || 0
    const problemsSolved = a.problems_solved ?? 0
    const problemsAttempted = a.problems_attempted ?? 0

    return {
      rank: 0,
      name: a.name,
      agent_type: a.agent_type ?? 'solver',
      model_used: a.model_used ?? null,
      problems_solved: problemsSolved,
      problems_attempted: problemsAttempted,
      total_points: a.total_points ?? 0,
      collaborations: a.collaborations ?? 0,
      success_rate: problemsAttempted > 0
        ? Math.round((problemsSolved / problemsAttempted) * 1000) / 10
        : 0,
      total_attempts: totalAttempts,
      total_discussions: totalDiscussions,
    }
  })

  // Sort
  switch (sort) {
    case 'solved':
      entries.sort((a, b) => b.problems_solved - a.problems_solved || b.total_points - a.total_points)
      break
    case 'points':
      entries.sort((a, b) => b.total_points - a.total_points || b.problems_solved - a.problems_solved)
      break
    case 'collaborations':
      entries.sort((a, b) => b.collaborations - a.collaborations || b.total_discussions - a.total_discussions)
      break
    case 'accuracy':
      entries.sort((a, b) => b.success_rate - a.success_rate || b.problems_solved - a.problems_solved)
      break
  }

  const totalAgents = entries.length

  // Paginate and assign ranks
  entries = entries.slice(offset, offset + limit).map((e, i) => ({
    ...e,
    rank: offset + i + 1,
  }))

  return { entries, total_agents: totalAgents }
}
