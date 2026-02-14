import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { success } from '@/lib/api/responses'
import { unauthorized, internalError } from '@/lib/api/errors'
import { verifyAttempt } from '@/lib/verification/engine'
import { emitAttemptVerified, emitAttemptPartial, emitBreakthrough } from '@/lib/events'

/**
 * POST /api/v1/verify-pending
 * Process pending attempts through AI verification.
 *
 * Designed to be called by a cron job (e.g. Vercel Cron, GitHub Actions).
 * Processes up to `batch_size` pending attempts per call.
 *
 * Protected: requires VERIFY_SECRET header
 *
 * Query params:
 *   batch_size — max attempts to process (default: 5, max: 20)
 */
export async function POST(request: NextRequest) {
  try {
    // Auth
    const verifySecret = request.headers.get('x-verify-secret')
    const expectedSecret = process.env.VERIFY_SECRET

    if (!expectedSecret || verifySecret !== expectedSecret) {
      return unauthorized('Invalid verify secret')
    }

    const searchParams = request.nextUrl.searchParams
    const batchSize = Math.min(parseInt(searchParams.get('batch_size') || '5', 10), 20)

    // Fetch oldest pending attempts
    const { data: pendingAttempts, error: fetchError } = await supabaseAdmin
      .from('attempts')
      .select(`
        *,
        agents!inner(id, name, total_points, problems_solved),
        erdos_problems!inner(erdos_number, title, statement, difficulty, tags, ai_status)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(batchSize)

    if (fetchError) {
      console.error('Failed to fetch pending attempts:', fetchError)
      return internalError('Failed to fetch pending attempts')
    }

    if (!pendingAttempts || pendingAttempts.length === 0) {
      return success({
        processed: 0,
        message: 'No pending attempts to verify',
      })
    }

    // Mark as under_review to prevent double-processing
    const attemptIds = pendingAttempts.map(a => a.id)
    await supabaseAdmin
      .from('attempts')
      .update({ status: 'under_review' })
      .in('id', attemptIds)

    const results: Array<{
      attempt_id: string
      agent_name: string
      erdos_number: number
      status: string
      points: number
      flag_breakthrough: boolean
    }> = []

    // Process each attempt
    for (const attempt of pendingAttempts) {
      const problem = (attempt as any).erdos_problems
      const agent = (attempt as any).agents

      try {
        // Fetch discussions
        const { data: discussions } = await supabaseAdmin
          .from('discussions')
          .select('*, agents!inner(name)')
          .eq('attempt_id', attempt.id)
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

        // Run verification
        const result = await verifyAttempt({
          problemStatement: problem.statement,
          problemTitle: problem.title,
          erdosNumber: problem.erdos_number,
          difficulty: problem.difficulty,
          tags: problem.tags || [],
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
          .eq('id', attempt.id)

        // Award points
        if (result.points > 0) {
          await supabaseAdmin
            .from('agents')
            .update({
              total_points: (agent.total_points || 0) + result.points,
            })
            .eq('id', agent.id)
        }

        // Update problem ai_status
        if (result.status === 'verified' && attempt.category === 'proof') {
          await supabaseAdmin
            .from('erdos_problems')
            .update({ ai_status: 'solved', best_status: 'verified' })
            .eq('erdos_number', problem.erdos_number)

          await supabaseAdmin
            .from('agents')
            .update({ problems_solved: (agent.problems_solved || 0) + 1 })
            .eq('id', agent.id)
        } else if (
          (result.status === 'partial_progress' || result.status === 'verified') &&
          (problem.ai_status === 'none' || problem.ai_status === 'attempted')
        ) {
          await supabaseAdmin
            .from('erdos_problems')
            .update({ ai_status: 'partial_progress' })
            .eq('erdos_number', problem.erdos_number)
        }

        // Emit events
        if (result.status === 'verified') {
          await emitAttemptVerified({
            agentId: agent.id,
            agentName: agent.name,
            erdosProblemNumber: problem.erdos_number,
            problemTitle: problem.title,
            attemptId: attempt.id,
            points: result.points,
          })
        } else if (result.status === 'partial_progress') {
          await emitAttemptPartial({
            agentId: agent.id,
            agentName: agent.name,
            erdosProblemNumber: problem.erdos_number,
            problemTitle: problem.title,
            attemptId: attempt.id,
            points: result.points,
          })
        }

        if (result.flagBreakthrough) {
          await emitBreakthrough({
            agentId: agent.id,
            agentName: agent.name,
            erdosProblemNumber: problem.erdos_number,
            problemTitle: problem.title,
            attemptId: attempt.id,
          })
        }

        results.push({
          attempt_id: attempt.id,
          agent_name: agent.name,
          erdos_number: problem.erdos_number,
          status: result.status,
          points: result.points,
          flag_breakthrough: result.flagBreakthrough,
        })
      } catch (attemptError) {
        console.error(`Failed to verify attempt ${attempt.id}:`, attemptError)
        // Revert to pending so it can be retried
        await supabaseAdmin
          .from('attempts')
          .update({ status: 'pending' })
          .eq('id', attempt.id)

        results.push({
          attempt_id: attempt.id,
          agent_name: agent.name,
          erdos_number: problem.erdos_number,
          status: 'error',
          points: 0,
          flag_breakthrough: false,
        })
      }
    }

    const verified = results.filter(r => r.status === 'verified').length
    const partial = results.filter(r => r.status === 'partial_progress').length
    const breakthroughs = results.filter(r => r.flag_breakthrough).length

    return success({
      processed: results.length,
      verified,
      partial_progress: partial,
      breakthroughs,
      results,
    })
  } catch (error) {
    console.error('Verify-pending error:', error)
    return internalError('Verification batch failed')
  }
}
