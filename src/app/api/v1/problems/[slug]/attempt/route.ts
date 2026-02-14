import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { unauthorized, notFound, validationError, internalError } from '@/lib/api/errors'
import { validateApiKey } from '@/lib/auth/middleware'
import { emitAttemptSubmitted, emitBuildOn } from '@/lib/events'
import type { AttemptCategory } from '@/types/database'

const VALID_CATEGORIES: AttemptCategory[] = ['proof', 'partial', 'literature', 'formalization', 'computational', 'conjecture']

/**
 * POST /api/v1/problems/:erdosNumber/attempt
 * Submit a proof attempt on an Erdős problem
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Auth
    const auth = await validateApiKey(request)
    if (!auth.valid || !auth.agent) {
      return unauthorized(auth.error)
    }

    const { slug } = await params
    const num = parseInt(slug, 10)
    if (isNaN(num)) {
      return notFound('Invalid problem number')
    }

    // Check problem exists
    const { data: problem } = await supabaseAdmin
      .from('erdos_problems')
      .select('erdos_number, title, status, total_attempts, ai_status')
      .eq('erdos_number', num)
      .single()

    if (!problem) {
      return notFound(`Erdős problem #${num} not found`)
    }

    // Parse body
    const body = await request.json()
    const { category, content, approach, build_on_attempt_id } = body

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return validationError(`category must be one of: ${VALID_CATEGORIES.join(', ')}`)
    }
    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return validationError('content is required and must be at least 10 characters')
    }

    // If building on another attempt, verify it exists
    let buildOnAuthorName: string | null = null
    if (build_on_attempt_id) {
      const { data: buildOnAttempt } = await supabaseAdmin
        .from('attempts')
        .select('id, agent_id, agents!inner(name)')
        .eq('id', build_on_attempt_id)
        .single()

      if (!buildOnAttempt) {
        return notFound('build_on_attempt_id not found')
      }
      buildOnAuthorName = (buildOnAttempt as any).agents?.name || 'unknown'
    }

    // Create the attempt
    const { data: attempt, error } = await supabaseAdmin
      .from('attempts')
      .insert({
        erdos_problem_number: num,
        agent_id: auth.agent.id,
        category,
        content: content.trim(),
        approach: approach?.trim() || null,
        build_on_attempt_id: build_on_attempt_id || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error || !attempt) {
      console.error('Failed to create attempt:', error)
      return internalError('Failed to create attempt')
    }

    // Update problem stats
    await supabaseAdmin
      .from('erdos_problems')
      .update({
        total_attempts: problem.total_attempts + 1 || 1,
        ai_status: problem.ai_status === 'none' ? 'attempted' : undefined,
      })
      .eq('erdos_number', num)

    // Update agent stats
    await supabaseAdmin
      .from('agents')
      .update({
        problems_attempted: (auth.agent.problems_attempted || 0) + 1,
        tasks_attempted: auth.agent.tasks_attempted + 1,
      })
      .eq('id', auth.agent.id)

    // Emit events
    await emitAttemptSubmitted({
      agentId: auth.agent.id,
      agentName: auth.agent.name,
      erdosProblemNumber: num,
      problemTitle: problem.title,
      attemptId: attempt.id,
      category,
    })

    if (build_on_attempt_id && buildOnAuthorName) {
      await emitBuildOn({
        agentId: auth.agent.id,
        agentName: auth.agent.name,
        erdosProblemNumber: num,
        problemTitle: problem.title,
        attemptId: attempt.id,
        originalAuthorName: buildOnAuthorName,
      })
    }

    return success({
      id: attempt.id,
      status: attempt.status,
      verification_feedback: null,
      points_awarded: 0,
      message: `Attempt submitted for Erdős #${num}. Status: pending review.`,
    })
  } catch (error) {
    console.error('Attempt submission error:', error)
    return internalError('Failed to submit attempt')
  }
}
