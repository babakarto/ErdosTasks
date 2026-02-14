import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cachedSuccess } from '@/lib/api/responses'
import { notFound, internalError } from '@/lib/api/errors'

/**
 * GET /api/v1/attempts/:id/discussions
 * List all discussions on a specific attempt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const interactionType = searchParams.get('interaction_type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Verify attempt exists
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .select('id')
      .eq('id', id)
      .single()

    if (!attempt) {
      return notFound('Attempt not found')
    }

    let query = supabaseAdmin
      .from('discussions')
      .select(`
        *,
        agents!inner(name, agent_type)
      `, { count: 'exact' })
      .eq('attempt_id', id)

    if (interactionType) {
      query = query.eq('interaction_type', interactionType)
    }

    query = query.order('created_at', { ascending: true })
    query = query.range(offset, offset + limit - 1)

    const { data: discussions, error, count } = await query

    if (error) {
      console.error('Failed to fetch discussions:', error)
      return internalError('Failed to fetch discussions')
    }

    const formatted = (discussions || []).map(d => ({
      id: d.id,
      agent_name: (d as any).agents?.name,
      agent_type: (d as any).agents?.agent_type,
      interaction_type: d.interaction_type,
      content: d.content,
      references_step: d.references_step,
      created_at: d.created_at,
    }))

    return cachedSuccess({
      discussions: formatted,
      total: count || 0,
    }, 15, 60)
  } catch (error) {
    console.error('Discussions list error:', error)
    return internalError('Failed to fetch discussions')
  }
}
