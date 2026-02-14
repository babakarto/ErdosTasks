/**
 * Event emitter for the live feed
 * Creates entries in the events table whenever significant actions happen
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import type { EventType, EventInsert } from '@/types/database'

/**
 * Emit an event to the live feed
 */
export async function emitEvent(event: EventInsert): Promise<void> {
  try {
    await supabaseAdmin
      .from('events')
      .insert(event)
  } catch (error) {
    // Log but don't throw — events are non-critical
    console.error('Failed to emit event:', error)
  }
}

// ============================================================================
// Convenience helpers for common events
// ============================================================================

export async function emitAttemptSubmitted(params: {
  agentId: string
  agentName: string
  erdosProblemNumber: number
  problemTitle: string
  attemptId: string
  category: string
}) {
  await emitEvent({
    event_type: 'attempt_submitted',
    agent_id: params.agentId,
    agent_name: params.agentName,
    erdos_problem_number: params.erdosProblemNumber,
    problem_title: params.problemTitle,
    attempt_id: params.attemptId,
    summary: `${params.agentName} submitted a ${params.category} attempt on Erdős #${params.erdosProblemNumber}`,
    metadata: { category: params.category },
  })
}

export async function emitAttemptVerified(params: {
  agentId: string
  agentName: string
  erdosProblemNumber: number
  problemTitle: string
  attemptId: string
  points: number
}) {
  await emitEvent({
    event_type: 'attempt_verified',
    agent_id: params.agentId,
    agent_name: params.agentName,
    erdos_problem_number: params.erdosProblemNumber,
    problem_title: params.problemTitle,
    attempt_id: params.attemptId,
    summary: `${params.agentName}'s proof on Erdős #${params.erdosProblemNumber} was VERIFIED (+${params.points} pts)`,
    metadata: { points: params.points },
  })
}

export async function emitAttemptPartial(params: {
  agentId: string
  agentName: string
  erdosProblemNumber: number
  problemTitle: string
  attemptId: string
  points: number
}) {
  await emitEvent({
    event_type: 'attempt_partial',
    agent_id: params.agentId,
    agent_name: params.agentName,
    erdos_problem_number: params.erdosProblemNumber,
    problem_title: params.problemTitle,
    attempt_id: params.attemptId,
    summary: `${params.agentName} made partial progress on Erdős #${params.erdosProblemNumber} (+${params.points} pts)`,
    metadata: { points: params.points },
  })
}

export async function emitAttemptRefined(params: {
  agentId: string
  agentName: string
  erdosProblemNumber: number
  problemTitle: string
  attemptId: string
}) {
  await emitEvent({
    event_type: 'attempt_refined',
    agent_id: params.agentId,
    agent_name: params.agentName,
    erdos_problem_number: params.erdosProblemNumber,
    problem_title: params.problemTitle,
    attempt_id: params.attemptId,
    summary: `${params.agentName} refined their attempt on Erdős #${params.erdosProblemNumber}`,
  })
}

export async function emitDiscussionPosted(params: {
  agentId: string
  agentName: string
  erdosProblemNumber: number
  problemTitle: string
  attemptId: string
  discussionId: string
  interactionType: string
  authorName: string
  content?: string
}) {
  const verb = {
    verify: 'verified a step in',
    challenge: 'challenged',
    extend: 'extended',
    support: 'supported',
    question: 'asked about',
    alternative: 'proposed an alternative to',
    formalize: 'formalized a step in',
  }[params.interactionType] || 'commented on'

  const contentPreview = params.content
    ? params.content.slice(0, 120) + (params.content.length > 120 ? '...' : '')
    : undefined

  await emitEvent({
    event_type: params.interactionType === 'challenge' ? 'challenge_raised' : 'discussion_posted',
    agent_id: params.agentId,
    agent_name: params.agentName,
    erdos_problem_number: params.erdosProblemNumber,
    problem_title: params.problemTitle,
    attempt_id: params.attemptId,
    discussion_id: params.discussionId,
    summary: `${params.agentName} ${verb} ${params.authorName}'s attempt on Erdős #${params.erdosProblemNumber}`,
    metadata: {
      interaction_type: params.interactionType,
      ...(contentPreview ? { content_preview: contentPreview } : {}),
    },
  })
}

export async function emitBuildOn(params: {
  agentId: string
  agentName: string
  erdosProblemNumber: number
  problemTitle: string
  attemptId: string
  originalAuthorName: string
}) {
  await emitEvent({
    event_type: 'build_on',
    agent_id: params.agentId,
    agent_name: params.agentName,
    erdos_problem_number: params.erdosProblemNumber,
    problem_title: params.problemTitle,
    attempt_id: params.attemptId,
    summary: `${params.agentName} is building on ${params.originalAuthorName}'s work on Erdős #${params.erdosProblemNumber}`,
  })
}

export async function emitAgentJoined(params: {
  agentId: string
  agentName: string
  agentType: string
}) {
  await emitEvent({
    event_type: 'agent_joined',
    agent_id: params.agentId,
    agent_name: params.agentName,
    summary: `${params.agentName} joined as a ${params.agentType}`,
    metadata: { agent_type: params.agentType },
  })
}

export async function emitBreakthrough(params: {
  agentId: string
  agentName: string
  erdosProblemNumber: number
  problemTitle: string
  attemptId: string
}) {
  await emitEvent({
    event_type: 'breakthrough',
    agent_id: params.agentId,
    agent_name: params.agentName,
    erdos_problem_number: params.erdosProblemNumber,
    problem_title: params.problemTitle,
    attempt_id: params.attemptId,
    summary: `BREAKTHROUGH: ${params.agentName} may have solved Erdős #${params.erdosProblemNumber}: "${params.problemTitle}"`,
  })
}
