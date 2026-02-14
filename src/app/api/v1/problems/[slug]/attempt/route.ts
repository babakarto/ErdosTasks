import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { unauthorized, notFound, validationError, internalError } from '@/lib/api/errors'
import { validateApiKey } from '@/lib/auth/middleware'
import { emitAttemptSubmitted, emitBuildOn, emitAttemptVerified, emitAttemptPartial, emitBreakthrough } from '@/lib/events'
import { verifyAttempt } from '@/lib/verification/engine'
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

    // Trigger AI verification in background (fire-and-forget)
    triggerVerification(
      attempt.id,
      { id: auth.agent.id, name: auth.agent.name, total_points: auth.agent.total_points, problems_solved: auth.agent.problems_solved ?? 0 },
      problem,
      category
    ).catch((err) =>
      console.error(`Background verification failed for attempt ${attempt.id}:`, err)
    )

    return success({
      id: attempt.id,
      status: attempt.status,
      verification_feedback: null,
      points_awarded: 0,
      message: `Attempt submitted for Erdős #${num}. Verification will run automatically.`,
    })
  } catch (error) {
    console.error('Attempt submission error:', error)
    return internalError('Failed to submit attempt')
  }
}

/**
 * Run AI verification on a newly submitted attempt (background, non-blocking)
 */
async function triggerVerification(
  attemptId: string,
  agent: { id: string; name: string; total_points: number; problems_solved: number },
  problem: { erdos_number: number; title: string; ai_status: string },
  category: AttemptCategory
) {
  // Fetch full attempt + problem data
  const { data: attempt } = await supabaseAdmin
    .from('attempts')
    .select(`
      *,
      erdos_problems!inner(erdos_number, title, statement, difficulty, tags, ai_status)
    `)
    .eq('id', attemptId)
    .single()

  if (!attempt) return

  const prob = (attempt as any).erdos_problems

  // Mark as under_review
  await supabaseAdmin
    .from('attempts')
    .update({ status: 'under_review' })
    .eq('id', attemptId)

  // Fetch discussions
  const { data: discussions } = await supabaseAdmin
    .from('discussions')
    .select('*, agents!inner(name)')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })
    .limit(20)

  // Fetch parent content if refinement
  let previousContent: string | null = null
  if (attempt.parent_attempt_id) {
    const { data: parent } = await supabaseAdmin
      .from('attempts')
      .select('content')
      .eq('id', attempt.parent_attempt_id)
      .single()
    previousContent = parent?.content || null
  }

  const result = await verifyAttempt({
    problemStatement: prob.statement,
    problemTitle: prob.title,
    erdosNumber: prob.erdos_number,
    difficulty: prob.difficulty,
    tags: prob.tags || [],
    attemptContent: attempt.content,
    category: attempt.category,
    approach: attempt.approach,
    discussions: (discussions || []).map((d: any) => ({
      agent_name: d.agents?.name || 'unknown',
      interaction_type: d.interaction_type,
      content: d.content,
    })),
    previousAttemptContent: previousContent,
  })

  // Update attempt
  await supabaseAdmin
    .from('attempts')
    .update({
      status: result.status,
      verification_feedback: result.feedback,
      points_awarded: result.points,
    })
    .eq('id', attemptId)

  // Award points
  if (result.points > 0) {
    await supabaseAdmin
      .from('agents')
      .update({ total_points: agent.total_points + result.points })
      .eq('id', agent.id)
  }

  // Update problem ai_status
  if (result.status === 'verified' && category === 'proof') {
    await supabaseAdmin
      .from('erdos_problems')
      .update({ ai_status: 'solved', best_status: 'verified' })
      .eq('erdos_number', prob.erdos_number)

    await supabaseAdmin
      .from('agents')
      .update({ problems_solved: (agent.problems_solved || 0) + 1 })
      .eq('id', agent.id)
  } else if (
    (result.status === 'partial_progress' || result.status === 'verified') &&
    (prob.ai_status === 'none' || prob.ai_status === 'attempted')
  ) {
    await supabaseAdmin
      .from('erdos_problems')
      .update({ ai_status: 'partial_progress' })
      .eq('erdos_number', prob.erdos_number)
  }

  // Emit events
  if (result.status === 'verified') {
    await emitAttemptVerified({
      agentId: agent.id,
      agentName: agent.name,
      erdosProblemNumber: prob.erdos_number,
      problemTitle: prob.title,
      attemptId,
      points: result.points,
    })
  } else if (result.status === 'partial_progress') {
    await emitAttemptPartial({
      agentId: agent.id,
      agentName: agent.name,
      erdosProblemNumber: prob.erdos_number,
      problemTitle: prob.title,
      attemptId,
      points: result.points,
    })
  }

  if (result.flagBreakthrough) {
    await emitBreakthrough({
      agentId: agent.id,
      agentName: agent.name,
      erdosProblemNumber: prob.erdos_number,
      problemTitle: prob.title,
      attemptId,
    })
  }
}
