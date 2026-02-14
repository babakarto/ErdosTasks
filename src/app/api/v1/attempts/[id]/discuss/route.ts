import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { unauthorized, notFound, validationError, internalError } from '@/lib/api/errors'
import { validateApiKey } from '@/lib/auth/middleware'
import { emitDiscussionPosted } from '@/lib/events'
import type { InteractionType } from '@/types/database'

const VALID_TYPES: InteractionType[] = ['verify', 'challenge', 'extend', 'support', 'question', 'alternative', 'formalize']

/**
 * POST /api/v1/attempts/:id/discuss
 * Post a discussion on another agent's attempt (collaboration)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth
    const auth = await validateApiKey(request)
    if (!auth.valid || !auth.agent) {
      return unauthorized(auth.error)
    }

    const { id } = await params

    // Fetch the attempt being discussed
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .select('*, agents!inner(name), erdos_problems!inner(erdos_number, title)')
      .eq('id', id)
      .single()

    if (!attempt) {
      return notFound('Attempt not found')
    }

    // Parse body
    const body = await request.json()
    const { interaction_type, content, references_step } = body

    if (!interaction_type || !VALID_TYPES.includes(interaction_type)) {
      return validationError(`interaction_type must be one of: ${VALID_TYPES.join(', ')}`)
    }
    if (!content || typeof content !== 'string' || content.trim().length < 5) {
      return validationError('content is required and must be at least 5 characters')
    }

    // Create the discussion
    const { data: discussion, error } = await supabaseAdmin
      .from('discussions')
      .insert({
        attempt_id: id,
        agent_id: auth.agent.id,
        interaction_type,
        content: content.trim(),
        references_step: references_step || null,
      })
      .select()
      .single()

    if (error || !discussion) {
      console.error('Failed to create discussion:', error)
      return internalError('Failed to post discussion')
    }

    // Update agent collaboration count
    await supabaseAdmin
      .from('agents')
      .update({ collaborations: (auth.agent.collaborations || 0) + 1 })
      .eq('id', auth.agent.id)

    const authorName = (attempt as any).agents?.name || 'unknown'
    const problemTitle = (attempt as any).erdos_problems?.title || ''
    const problemNumber = (attempt as any).erdos_problems?.erdos_number

    // Emit event
    await emitDiscussionPosted({
      agentId: auth.agent.id,
      agentName: auth.agent.name,
      erdosProblemNumber: problemNumber,
      problemTitle,
      attemptId: id,
      discussionId: discussion.id,
      interactionType: interaction_type,
      authorName,
    })

    return success({
      id: discussion.id,
      interaction_type: discussion.interaction_type,
      message: `Discussion posted on ${authorName}'s attempt`,
    })
  } catch (error) {
    console.error('Discussion error:', error)
    return internalError('Failed to post discussion')
  }
}
