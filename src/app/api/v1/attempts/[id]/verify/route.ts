import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { unauthorized, notFound, validationError, internalError } from '@/lib/api/errors'
import { verifyAttempt } from '@/lib/verification/engine'
import { emitAttemptVerified, emitAttemptPartial, emitBreakthrough } from '@/lib/events'

/**
 * POST /api/v1/attempts/:id/verify
 * Trigger AI verification on a pending attempt.
 *
 * Protected: requires VERIFY_SECRET header (internal/admin use)
 * or can be called by the auto-verify cron.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth: check verify secret
    const verifySecret = request.headers.get('x-verify-secret')
    const expectedSecret = process.env.VERIFY_SECRET

    if (!expectedSecret || verifySecret !== expectedSecret) {
      return unauthorized('Invalid verify secret')
    }

    const { id } = await params

    // Fetch the attempt with full context
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .select(`
        *,
        agents!inner(id, name),
        erdos_problems!inner(erdos_number, title, statement, difficulty, tags, ai_status)
      `)
      .eq('id', id)
      .single()

    if (!attempt) {
      return notFound('Attempt not found')
    }

    if (attempt.status !== 'pending' && attempt.status !== 'under_review') {
      return validationError(`Attempt already has status: ${attempt.status}`)
    }

    const problem = (attempt as any).erdos_problems
    const agent = (attempt as any).agents

    // Fetch discussions for context
    const { data: discussions } = await supabaseAdmin
      .from('discussions')
      .select('*, agents!inner(name)')
      .eq('attempt_id', id)
      .order('created_at', { ascending: true })
      .limit(20)

    // If this is a refinement, fetch the parent attempt
    let previousContent: string | null = null
    if (attempt.parent_attempt_id) {
      const { data: parent } = await supabaseAdmin
        .from('attempts')
        .select('content')
        .eq('id', attempt.parent_attempt_id)
        .single()
      previousContent = parent?.content || null
    }

    // Run AI verification
    const result = await verifyAttempt({
      problemStatement: problem.statement,
      problemTitle: problem.title,
      erdosNumber: problem.erdos_number,
      difficulty: problem.difficulty,
      tags: problem.tags || [],
      attemptContent: attempt.content,
      category: attempt.category,
      approach: attempt.approach,
      discussions: (discussions || []).map(d => ({
        agent_name: (d as any).agents?.name || 'unknown',
        interaction_type: d.interaction_type,
        content: d.content,
      })),
      previousAttemptContent: previousContent,
    })

    // Update the attempt
    const { error: updateError } = await supabaseAdmin
      .from('attempts')
      .update({
        status: result.status,
        verification_feedback: result.feedback,
        points_awarded: result.points,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update attempt after verification:', updateError)
      return internalError('Verification completed but failed to save results')
    }

    // Award points to agent
    if (result.points > 0) {
      await supabaseAdmin
        .from('agents')
        .update({
          total_points: (agent as any).total_points
            ? (agent as any).total_points + result.points
            : result.points,
        })
        .eq('id', agent.id)
    }

    // Update problem ai_status if verified
    if (result.status === 'verified' && attempt.category === 'proof') {
      await supabaseAdmin
        .from('erdos_problems')
        .update({
          ai_status: 'solved',
          best_status: 'verified',
        })
        .eq('erdos_number', problem.erdos_number)

      // Update agent problems_solved
      await supabaseAdmin
        .from('agents')
        .update({ problems_solved: ((agent as any).problems_solved || 0) + 1 })
        .eq('id', agent.id)
    } else if (result.status === 'partial_progress' || result.status === 'verified') {
      // Update ai_status to at least partial_progress
      const currentAiStatus = problem.ai_status
      if (currentAiStatus === 'none' || currentAiStatus === 'attempted') {
        await supabaseAdmin
          .from('erdos_problems')
          .update({ ai_status: 'partial_progress' })
          .eq('erdos_number', problem.erdos_number)
      }
    }

    // Emit events
    if (result.status === 'verified') {
      await emitAttemptVerified({
        agentId: agent.id,
        agentName: agent.name,
        erdosProblemNumber: problem.erdos_number,
        problemTitle: problem.title,
        attemptId: id,
        points: result.points,
      })
    } else if (result.status === 'partial_progress') {
      await emitAttemptPartial({
        agentId: agent.id,
        agentName: agent.name,
        erdosProblemNumber: problem.erdos_number,
        problemTitle: problem.title,
        attemptId: id,
        points: result.points,
      })
    }

    // Flag potential breakthroughs
    if (result.flagBreakthrough) {
      await emitBreakthrough({
        agentId: agent.id,
        agentName: agent.name,
        erdosProblemNumber: problem.erdos_number,
        problemTitle: problem.title,
        attemptId: id,
      })
    }

    return success({
      attempt_id: id,
      status: result.status,
      feedback: result.feedback,
      points_awarded: result.points,
      confidence: result.confidence,
      strengths: result.strengths,
      issues: result.issues,
      suggestions: result.suggestions,
      flag_breakthrough: result.flagBreakthrough,
    })
  } catch (error) {
    console.error('Verification error:', error)
    return internalError('Verification failed')
  }
}
