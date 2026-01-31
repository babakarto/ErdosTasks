import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/auth/middleware'
import { success } from '@/lib/api/responses'
import { unauthorized, notFound, notClaimed, claimExpired, validationError, internalError } from '@/lib/api/errors'
import { isClaimValid } from '@/lib/tasks/claim-expiration'
import { verify } from '@/lib/verifiers'
import { calculatePoints, formatPointsBreakdown, checkAndAwardBadges, formatAwardedBadges } from '@/lib/gamification'
import type { SubmitTaskRequest, SubmitTaskResponse } from '@/types/api'
import type { TaskType } from '@/types/database'

/**
 * POST /api/v1/tasks/[id]/submit
 * Submit a solution for a claimed task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiKey(request)

  if (!authResult.valid || !authResult.agent) {
    return unauthorized(authResult.error)
  }

  const { id } = await params
  const agent = authResult.agent

  try {
    const body = await request.json() as SubmitTaskRequest

    if (!body.answer) {
      return validationError('Answer is required')
    }

    // Get the task with problem info
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        problem:problems!inner(*)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !task) {
      return notFound(`Task '${id}' not found`)
    }

    // Check if agent has claimed this task
    if (task.claimed_by !== agent.id) {
      return notClaimed('You must claim this task before submitting')
    }

    // Check if claim is still valid
    if (!isClaimValid(task.claimed_at)) {
      // Reset task to open
      await supabaseAdmin
        .from('tasks')
        .update({
          status: 'open',
          claimed_by: null,
          claimed_at: null,
        })
        .eq('id', id)

      return claimExpired('Your claim on this task has expired')
    }

    // Increment tasks attempted
    await supabaseAdmin
      .from('agents')
      .update({
        tasks_attempted: agent.tasks_attempted + 1,
      })
      .eq('id', agent.id)

    // Verify the answer
    const verificationResult = verify({
      problemSlug: task.problem.slug,
      taskType: task.type as TaskType,
      parameters: task.parameters as Record<string, unknown>,
      answer: body.answer,
    })

    // Calculate points with bonuses (first solver, counterexample, etc.)
    let pointsAwarded = 0
    let pointsMessage = verificationResult.message
    let badgesAwarded: string[] = []

    // Check if answer contains counterexample
    const foundCounterexample = task.type === 'SEARCH' && body.answer.found === true

    if (verificationResult.verified) {
      const pointsResult = await calculatePoints({
        task: {
          id,
          type: task.type as TaskType,
          points: task.points,
        },
        answer: body.answer,
        supabase: supabaseAdmin,
      })
      pointsAwarded = pointsResult.totalPoints

      // Add points breakdown to message
      const breakdown = formatPointsBreakdown(pointsResult)
      pointsMessage = `${verificationResult.message} (${breakdown})`
    }

    // Create submission record
    const { error: submissionError } = await supabaseAdmin
      .from('submissions')
      .insert({
        task_id: id,
        agent_id: agent.id,
        answer: body.answer,
        explanation: body.explanation || null,
        status: verificationResult.verified ? 'verified' : 'rejected',
        verified_at: new Date().toISOString(),
        points_awarded: pointsAwarded,
      })

    if (submissionError) {
      console.error('Failed to create submission:', submissionError)
      return internalError('Failed to record submission')
    }

    if (verificationResult.verified) {
      // Update task status to completed
      await supabaseAdmin
        .from('tasks')
        .update({
          status: 'completed',
        })
        .eq('id', id)

      // Update agent points and completed count
      const newTasksCompleted = agent.tasks_completed + 1
      const newTotalPoints = agent.total_points + pointsAwarded

      await supabaseAdmin
        .from('agents')
        .update({
          total_points: newTotalPoints,
          tasks_completed: newTasksCompleted,
          is_active: true, // Mark as active after first successful submission
        })
        .eq('id', agent.id)

      // Check and award badges
      try {
        const badgeResult = await checkAndAwardBadges({
          agentId: agent.id,
          totalPoints: newTotalPoints,
          tasksCompleted: newTasksCompleted,
          tasksAttempted: agent.tasks_attempted + 1,
          task: {
            id,
            type: task.type,
            problemSlug: task.problem.slug,
            claimedAt: task.claimed_at,
          },
          submission: {
            verified: true,
            foundCounterexample,
          },
          supabase: supabaseAdmin,
        })

        if (badgeResult.awarded.length > 0) {
          badgesAwarded = badgeResult.awarded.map((b) => `${b.icon} ${b.name}`)
          const badgeMessage = formatAwardedBadges(badgeResult.awarded)
          if (badgeMessage) {
            pointsMessage = `${pointsMessage} ${badgeMessage}`
          }
        }
      } catch (badgeError) {
        // Log but don't fail the submission if badge checking fails
        console.error('Badge checking failed:', badgeError)
      }
    } else {
      // Reset task to open on rejection
      await supabaseAdmin
        .from('tasks')
        .update({
          status: 'open',
          claimed_by: null,
          claimed_at: null,
        })
        .eq('id', id)
    }

    const response: SubmitTaskResponse = {
      success: verificationResult.verified,
      status: verificationResult.verified ? 'verified' : 'rejected',
      points_awarded: pointsAwarded,
      message: pointsMessage,
      badges_awarded: badgesAwarded.length > 0 ? badgesAwarded : undefined,
    }

    return success(response)
  } catch (error) {
    console.error('Submit error:', error)
    return internalError('Failed to submit solution')
  }
}
