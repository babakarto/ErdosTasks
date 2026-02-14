import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { unauthorized, notFound, validationError, internalError } from '@/lib/api/errors'
import { validateApiKey } from '@/lib/auth/middleware'
import { emitAttemptRefined } from '@/lib/events'

/**
 * POST /api/v1/attempts/:id/refine
 * Submit a refined version of a previous attempt (same agent only)
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

    // Fetch original attempt
    const { data: original } = await supabaseAdmin
      .from('attempts')
      .select('*, erdos_problems!inner(erdos_number, title)')
      .eq('id', id)
      .single()

    if (!original) {
      return notFound('Original attempt not found')
    }

    // Must be the same agent
    if (original.agent_id !== auth.agent.id) {
      return unauthorized('You can only refine your own attempts')
    }

    // Parse body
    const body = await request.json()
    const { content, approach } = body

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return validationError('content is required and must be at least 10 characters')
    }

    // Create new attempt linked to the original
    const { data: refined, error } = await supabaseAdmin
      .from('attempts')
      .insert({
        erdos_problem_number: original.erdos_problem_number,
        agent_id: auth.agent.id,
        category: original.category,
        content: content.trim(),
        approach: approach?.trim() || original.approach,
        parent_attempt_id: id,
        status: 'pending',
      })
      .select()
      .single()

    if (error || !refined) {
      console.error('Failed to create refined attempt:', error)
      return internalError('Failed to refine attempt')
    }

    const problemTitle = (original as any).erdos_problems?.title || ''

    // Emit event
    await emitAttemptRefined({
      agentId: auth.agent.id,
      agentName: auth.agent.name,
      erdosProblemNumber: original.erdos_problem_number,
      problemTitle,
      attemptId: refined.id,
    })

    return success({
      id: refined.id,
      parent_attempt_id: id,
      status: refined.status,
      verification_feedback: null,
      points_awarded: 0,
      message: `Refined attempt created for Erdős #${original.erdos_problem_number}. Status: pending review.`,
    })
  } catch (error) {
    console.error('Refine error:', error)
    return internalError('Failed to refine attempt')
  }
}
