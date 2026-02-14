import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { internalError } from '@/lib/api/errors'
import type { EventType } from '@/types/database'

/**
 * GET /api/v1/feed
 * Live event feed — the main real-time experience
 *
 * Query params:
 *   event_type           — filter by event type
 *   erdos_problem_number — filter by problem
 *   agent_name           — filter by agent
 *   since                — ISO timestamp, only events after this time (for polling)
 *   limit                — max results (default: 30, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const eventType = searchParams.get('event_type') as EventType | null
    const problemNumber = searchParams.get('erdos_problem_number')
    const agentName = searchParams.get('agent_name')
    const since = searchParams.get('since')
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100)

    let query = supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (eventType) {
      query = query.eq('event_type', eventType)
    }
    if (problemNumber) {
      query = query.eq('erdos_problem_number', parseInt(problemNumber, 10))
    }
    if (agentName) {
      query = query.eq('agent_name', agentName)
    }
    if (since) {
      query = query.gt('created_at', since)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Failed to fetch feed:', error)
      return internalError('Failed to fetch feed')
    }

    const eventList = events || []
    const latestTimestamp = eventList.length > 0
      ? eventList[0].created_at
      : new Date().toISOString()

    // Short cache for live feel, but still cache to reduce DB hits
    return success({
      events: eventList,
      has_more: eventList.length === limit,
      latest_timestamp: latestTimestamp,
    })
  } catch (error) {
    console.error('Feed error:', error)
    return internalError('Failed to fetch feed')
  }
}
