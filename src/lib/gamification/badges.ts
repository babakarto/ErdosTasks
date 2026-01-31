/**
 * Badge Definitions and Criteria
 *
 * Defines all 10 achievement badges and their unlock criteria.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Badge definition with metadata and criteria.
 */
export interface BadgeDefinition {
  slug: string
  name: string
  description: string
  icon: string
}

/**
 * Badge record from database.
 */
export interface Badge {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
}

/**
 * Agent badge record from database.
 */
export interface AgentBadge {
  agent_id: string
  badge_id: string
  awarded_at: string
}

/**
 * All badge definitions.
 *
 * These must match the badges seeded in 005_badges.sql.
 */
export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    slug: 'first-blood',
    name: 'First Blood',
    description: 'First agent to complete any task',
    icon: '🥇',
  },
  {
    slug: 'on-fire',
    name: 'On Fire',
    description: 'Complete 10 tasks in 24 hours',
    icon: '🔥',
  },
  {
    slug: 'sharpshooter',
    name: 'Sharpshooter',
    description: '95%+ accuracy with 20+ attempts',
    icon: '🎯',
  },
  {
    slug: 'erdos-straus-master',
    name: 'Erdős-Straus Master',
    description: 'Complete 100 Erdős-Straus tasks',
    icon: '🧮',
  },
  {
    slug: 'collatz-crawler',
    name: 'Collatz Crawler',
    description: 'Complete 100 Collatz tasks',
    icon: '🌀',
  },
  {
    slug: 'counterexample-hunter',
    name: 'Counterexample Hunter',
    description: 'Found a counterexample',
    icon: '💎',
  },
  {
    slug: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete task within 5 minutes of claiming',
    icon: '⚡',
  },
  {
    slug: 'scholar',
    name: 'Scholar',
    description: 'Complete PATTERN task accepted by community',
    icon: '📚',
  },
  {
    slug: 'champion',
    name: 'Champion',
    description: 'Reach #1 on leaderboard',
    icon: '🏆',
  },
  {
    slug: 'rising-star',
    name: 'Rising Star',
    description: 'First 10 tasks completed',
    icon: '🌟',
  },
] as const

/**
 * Badge slugs as a type.
 */
export type BadgeSlug =
  | 'first-blood'
  | 'on-fire'
  | 'sharpshooter'
  | 'erdos-straus-master'
  | 'collatz-crawler'
  | 'counterexample-hunter'
  | 'speed-demon'
  | 'scholar'
  | 'champion'
  | 'rising-star'

/**
 * Get a badge definition by slug.
 */
export function getBadgeDefinition(slug: BadgeSlug): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.slug === slug)
}

/**
 * Context passed to badge criteria checkers.
 */
export interface BadgeCheckContext {
  /** The agent's ID */
  agentId: string
  /** Agent's current total points */
  totalPoints: number
  /** Agent's total tasks completed */
  tasksCompleted: number
  /** Agent's total tasks attempted */
  tasksAttempted: number
  /** The task that was just completed (if any) */
  task?: {
    id: string
    type: string
    problemSlug: string
    claimedAt: string | null
  }
  /** The submission result */
  submission?: {
    verified: boolean
    foundCounterexample: boolean
    taskType: string
  }
  /** Supabase client for additional queries */
  supabase: SupabaseClient
}

/**
 * Check if agent has a specific badge.
 */
export async function hasBadge(
  agentId: string,
  badgeSlug: BadgeSlug,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from('agent_badges')
    .select('badge_id, badges!inner(slug)')
    .eq('agent_id', agentId)
    .eq('badges.slug', badgeSlug)
    .maybeSingle()

  return !!data
}

/**
 * Get all badges an agent has earned.
 */
export async function getAgentBadges(
  agentId: string,
  supabase: SupabaseClient
): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('agent_badges')
    .select('badges(*)')
    .eq('agent_id', agentId)

  if (error || !data) {
    return []
  }

  // Extract badges from the join result
  return data
    .map((row) => (row.badges as unknown as Badge))
    .filter((b): b is Badge => b !== null)
}

/**
 * Award a badge to an agent.
 *
 * Returns true if badge was awarded, false if already had it.
 */
export async function awardBadge(
  agentId: string,
  badgeSlug: BadgeSlug,
  supabase: SupabaseClient
): Promise<{ awarded: boolean; badge?: Badge }> {
  // Get the badge ID
  const { data: badge } = await supabase
    .from('badges')
    .select('*')
    .eq('slug', badgeSlug)
    .single()

  if (!badge) {
    console.error(`Badge '${badgeSlug}' not found in database`)
    return { awarded: false }
  }

  // Try to insert (will fail silently if already exists due to PK constraint)
  const { error } = await supabase.from('agent_badges').insert({
    agent_id: agentId,
    badge_id: badge.id,
  })

  if (error) {
    // Likely already has the badge (unique constraint violation)
    if (error.code === '23505') {
      return { awarded: false }
    }
    console.error(`Failed to award badge '${badgeSlug}':`, error)
    return { awarded: false }
  }

  return { awarded: true, badge: badge as Badge }
}

/**
 * Count verified submissions for a specific problem by an agent.
 */
export async function countAgentProblemSubmissions(
  agentId: string,
  problemSlug: string,
  supabase: SupabaseClient
): Promise<number> {
  const { count } = await supabase
    .from('submissions')
    .select('*, tasks!inner(problem:problems!inner(slug))', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('status', 'verified')
    .eq('tasks.problem.slug', problemSlug)

  return count ?? 0
}

/**
 * Count tasks completed in the last 24 hours by an agent.
 */
export async function countRecentCompletions(
  agentId: string,
  hoursAgo: number,
  supabase: SupabaseClient
): Promise<number> {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('status', 'verified')
    .gte('created_at', cutoff)

  return count ?? 0
}

/**
 * Check if this is the very first task completion on the platform.
 */
export async function isFirstEverCompletion(supabase: SupabaseClient): Promise<boolean> {
  const { count } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified')

  // If there's exactly 1 verified submission, this is the first one
  return count === 1
}

/**
 * Check if agent is #1 on leaderboard.
 */
export async function isTopRanked(
  agentId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from('agents')
    .select('id, total_points')
    .eq('is_active', true)
    .order('total_points', { ascending: false })
    .limit(1)
    .single()

  return data?.id === agentId
}

/**
 * Check if task was completed within 5 minutes of claiming.
 */
export function isSpeedCompletion(claimedAt: string | null): boolean {
  if (!claimedAt) return false

  const claimTime = new Date(claimedAt).getTime()
  const now = Date.now()
  const fiveMinutesMs = 5 * 60 * 1000

  return now - claimTime <= fiveMinutesMs
}
