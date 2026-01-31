import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import { getLeaderboard, type LeaderboardType } from '@/lib/gamification'
import type { LeaderboardResponse } from '@/types/api'

/**
 * GET /api/v1/leaderboard
 * Get agent rankings
 *
 * Query params:
 * - type: 'alltime' | 'weekly' | 'monthly' | 'accuracy' (default: 'alltime')
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const typeParam = searchParams.get('type') || 'alltime'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  // Validate type parameter
  const validTypes: LeaderboardType[] = ['alltime', 'weekly', 'monthly', 'accuracy']
  const type: LeaderboardType = validTypes.includes(typeParam as LeaderboardType)
    ? (typeParam as LeaderboardType)
    : 'alltime'

  try {
    const result = await getLeaderboard(supabaseAdmin, type, limit, offset)

    const response: LeaderboardResponse = {
      entries: result.entries,
      type: type === 'accuracy' ? 'alltime' : type, // Map 'accuracy' to 'alltime' for API response type
    }

    // Cache for 5 minutes with 10 minute stale-while-revalidate
    return cachedSuccess(response, 300, 600)
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return internalError('Failed to fetch leaderboard')
  }
}
