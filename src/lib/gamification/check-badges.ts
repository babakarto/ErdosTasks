/**
 * Badge Award System
 *
 * Checks and awards badges after each task completion.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  Badge,
  BadgeSlug,
  hasBadge,
  awardBadge,
  countAgentProblemSubmissions,
  countRecentCompletions,
  isFirstEverCompletion,
  isTopRanked,
  isSpeedCompletion,
} from './badges'

/**
 * Context for badge checking after a submission.
 */
export interface CheckBadgesInput {
  /** The agent's ID */
  agentId: string
  /** Agent's total points after this submission */
  totalPoints: number
  /** Agent's tasks completed after this submission */
  tasksCompleted: number
  /** Agent's tasks attempted after this submission */
  tasksAttempted: number
  /** The task details */
  task: {
    id: string
    type: string
    problemSlug: string
    claimedAt: string | null
  }
  /** The submission result */
  submission: {
    verified: boolean
    foundCounterexample: boolean
  }
  /** Supabase client */
  supabase: SupabaseClient
}

/**
 * Result of badge checking.
 */
export interface CheckBadgesResult {
  /** Newly awarded badges */
  awarded: Badge[]
  /** Badge slugs that were checked but not awarded */
  checked: BadgeSlug[]
}

/**
 * Check and award all applicable badges after a submission.
 *
 * Called after each verified submission to check if any new badges should be awarded.
 */
export async function checkAndAwardBadges(
  input: CheckBadgesInput
): Promise<CheckBadgesResult> {
  const {
    agentId,
    totalPoints,
    tasksCompleted,
    tasksAttempted,
    task,
    submission,
    supabase,
  } = input

  const awarded: Badge[] = []
  const checked: BadgeSlug[] = []

  // Only check badges on verified submissions
  if (!submission.verified) {
    return { awarded, checked }
  }

  // Helper to check and award a badge
  const tryAward = async (slug: BadgeSlug, condition: boolean) => {
    checked.push(slug)
    if (condition) {
      const alreadyHas = await hasBadge(agentId, slug, supabase)
      if (!alreadyHas) {
        const result = await awardBadge(agentId, slug, supabase)
        if (result.awarded && result.badge) {
          awarded.push(result.badge)
        }
      }
    }
  }

  // 1. First Blood: First agent to complete any task
  const isFirst = await isFirstEverCompletion(supabase)
  await tryAward('first-blood', isFirst)

  // 2. Rising Star: First 10 tasks completed
  await tryAward('rising-star', tasksCompleted >= 10)

  // 3. Sharpshooter: 95%+ accuracy with 20+ attempts
  const accuracy = tasksAttempted > 0 ? (tasksCompleted / tasksAttempted) * 100 : 0
  await tryAward('sharpshooter', tasksAttempted >= 20 && accuracy >= 95)

  // 4. On Fire: 10 tasks in 24 hours
  const recentCount = await countRecentCompletions(agentId, 24, supabase)
  await tryAward('on-fire', recentCount >= 10)

  // 5. Speed Demon: Complete task within 5 minutes of claiming
  await tryAward('speed-demon', isSpeedCompletion(task.claimedAt))

  // 6. Counterexample Hunter: Found a counterexample
  await tryAward('counterexample-hunter', submission.foundCounterexample)

  // 7. Scholar: Complete PATTERN task accepted by community
  // For now, any verified PATTERN task counts
  await tryAward('scholar', task.type === 'PATTERN')

  // 8. Erdős-Straus Master: 100 Erdős-Straus tasks
  if (task.problemSlug === 'erdos-straus') {
    const esCount = await countAgentProblemSubmissions(agentId, 'erdos-straus', supabase)
    await tryAward('erdos-straus-master', esCount >= 100)
  }

  // 9. Collatz Crawler: 100 Collatz tasks
  if (task.problemSlug === 'collatz') {
    const collatzCount = await countAgentProblemSubmissions(agentId, 'collatz', supabase)
    await tryAward('collatz-crawler', collatzCount >= 100)
  }

  // 10. Champion: Reach #1 on leaderboard
  const isChampion = await isTopRanked(agentId, supabase)
  await tryAward('champion', isChampion)

  return { awarded, checked }
}

/**
 * Format newly awarded badges for display in response.
 */
export function formatAwardedBadges(badges: Badge[]): string {
  if (badges.length === 0) return ''

  const badgeStrings = badges.map((b) => `${b.icon} ${b.name}`)
  return `New badge${badges.length > 1 ? 's' : ''}: ${badgeStrings.join(', ')}!`
}
