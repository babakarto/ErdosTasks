/**
 * Enhanced Leaderboard System
 *
 * Multiple leaderboard views: all-time, weekly, monthly, by-problem, by-accuracy
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeaderboardEntry } from '@/types/database'

/**
 * Leaderboard type options.
 */
export type LeaderboardType = 'alltime' | 'weekly' | 'monthly' | 'accuracy'

/**
 * Extended leaderboard entry with additional fields.
 */
export interface ExtendedLeaderboardEntry extends LeaderboardEntry {
  tasks_attempted?: number
  daily_streak?: number
}

/**
 * Leaderboard query result.
 */
export interface LeaderboardResult {
  entries: LeaderboardEntry[]
  type: LeaderboardType
  total: number
}

/**
 * Get the all-time leaderboard (ranked by total_points).
 */
export async function getAllTimeLeaderboard(
  supabase: SupabaseClient,
  limit: number = 20,
  offset: number = 0
): Promise<LeaderboardResult> {
  const { data, error, count } = await supabase
    .from('agents')
    .select('name, total_points, tasks_completed, tasks_attempted', { count: 'exact' })
    .eq('is_active', true)
    .order('total_points', { ascending: false })
    .order('tasks_completed', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !data) {
    console.error('Failed to fetch all-time leaderboard:', error)
    return { entries: [], type: 'alltime', total: 0 }
  }

  const entries: LeaderboardEntry[] = data.map((agent, index) => ({
    rank: offset + index + 1,
    name: agent.name,
    total_points: agent.total_points ?? 0,
    tasks_completed: agent.tasks_completed ?? 0,
    success_rate: agent.tasks_attempted > 0
      ? Math.round((agent.tasks_completed / agent.tasks_attempted) * 1000) / 10
      : 0,
  }))

  return { entries, type: 'alltime', total: count ?? 0 }
}

/**
 * Get the weekly leaderboard (ranked by weekly_points).
 */
export async function getWeeklyLeaderboard(
  supabase: SupabaseClient,
  limit: number = 20,
  offset: number = 0
): Promise<LeaderboardResult> {
  const { data, error, count } = await supabase
    .from('agents')
    .select('name, weekly_points, tasks_completed, tasks_attempted', { count: 'exact' })
    .eq('is_active', true)
    .gt('weekly_points', 0)
    .order('weekly_points', { ascending: false })
    .order('tasks_completed', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !data) {
    console.error('Failed to fetch weekly leaderboard:', error)
    return { entries: [], type: 'weekly', total: 0 }
  }

  const entries: LeaderboardEntry[] = data.map((agent, index) => ({
    rank: offset + index + 1,
    name: agent.name,
    total_points: agent.weekly_points ?? 0,
    tasks_completed: agent.tasks_completed ?? 0,
    success_rate: agent.tasks_attempted > 0
      ? Math.round((agent.tasks_completed / agent.tasks_attempted) * 1000) / 10
      : 0,
  }))

  return { entries, type: 'weekly', total: count ?? 0 }
}

/**
 * Get the monthly leaderboard (ranked by monthly_points).
 */
export async function getMonthlyLeaderboard(
  supabase: SupabaseClient,
  limit: number = 20,
  offset: number = 0
): Promise<LeaderboardResult> {
  const { data, error, count } = await supabase
    .from('agents')
    .select('name, monthly_points, tasks_completed, tasks_attempted', { count: 'exact' })
    .eq('is_active', true)
    .gt('monthly_points', 0)
    .order('monthly_points', { ascending: false })
    .order('tasks_completed', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !data) {
    console.error('Failed to fetch monthly leaderboard:', error)
    return { entries: [], type: 'monthly', total: 0 }
  }

  const entries: LeaderboardEntry[] = data.map((agent, index) => ({
    rank: offset + index + 1,
    name: agent.name,
    total_points: agent.monthly_points ?? 0,
    tasks_completed: agent.tasks_completed ?? 0,
    success_rate: agent.tasks_attempted > 0
      ? Math.round((agent.tasks_completed / agent.tasks_attempted) * 1000) / 10
      : 0,
  }))

  return { entries, type: 'monthly', total: count ?? 0 }
}

/**
 * Get the accuracy leaderboard (ranked by success_rate, min 20 attempts).
 */
export async function getAccuracyLeaderboard(
  supabase: SupabaseClient,
  limit: number = 20,
  offset: number = 0
): Promise<LeaderboardResult> {
  // Fetch agents with at least 20 attempts
  const { data, error, count } = await supabase
    .from('agents')
    .select('name, total_points, tasks_completed, tasks_attempted', { count: 'exact' })
    .eq('is_active', true)
    .gte('tasks_attempted', 20)
    .order('tasks_completed', { ascending: false }) // Order by completed first to help sorting

  if (error || !data) {
    console.error('Failed to fetch accuracy leaderboard:', error)
    return { entries: [], type: 'accuracy', total: 0 }
  }

  // Calculate success rate and sort
  const withSuccessRate = data.map((agent) => ({
    ...agent,
    success_rate: agent.tasks_attempted > 0
      ? Math.round((agent.tasks_completed / agent.tasks_attempted) * 1000) / 10
      : 0,
  }))

  // Sort by success rate (desc), then by tasks_completed (desc)
  withSuccessRate.sort((a, b) => {
    if (b.success_rate !== a.success_rate) {
      return b.success_rate - a.success_rate
    }
    return b.tasks_completed - a.tasks_completed
  })

  // Apply pagination
  const paginated = withSuccessRate.slice(offset, offset + limit)

  const entries: LeaderboardEntry[] = paginated.map((agent, index) => ({
    rank: offset + index + 1,
    name: agent.name,
    total_points: agent.total_points ?? 0,
    tasks_completed: agent.tasks_completed ?? 0,
    success_rate: agent.success_rate,
  }))

  return { entries, type: 'accuracy', total: count ?? 0 }
}

/**
 * Get leaderboard by problem (top solvers for a specific problem).
 */
export async function getProblemLeaderboard(
  supabase: SupabaseClient,
  problemSlug: string,
  limit: number = 20
): Promise<{ entries: Array<{ name: string; count: number; points: number }>; total: number }> {
  // Get verified submissions for this problem with agent info
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      agent_id,
      points_awarded,
      agents!inner(name),
      tasks!inner(problem:problems!inner(slug))
    `)
    .eq('status', 'verified')
    .eq('tasks.problem.slug', problemSlug)

  if (error || !data) {
    console.error('Failed to fetch problem leaderboard:', error)
    return { entries: [], total: 0 }
  }

  // Aggregate by agent
  const agentStats = new Map<string, { name: string; count: number; points: number }>()

  for (const submission of data) {
    // Handle both array and object response types from Supabase join
    const agents = submission.agents as unknown
    const agentName = Array.isArray(agents)
      ? (agents[0] as { name: string } | undefined)?.name
      : (agents as { name: string } | null)?.name
    if (!agentName) continue

    const existing = agentStats.get(agentName) ?? { name: agentName, count: 0, points: 0 }
    existing.count += 1
    existing.points += submission.points_awarded ?? 0
    agentStats.set(agentName, existing)
  }

  // Sort by count (desc), then by points (desc)
  const sorted = Array.from(agentStats.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return b.points - a.points
    })
    .slice(0, limit)

  return { entries: sorted, total: agentStats.size }
}

/**
 * Get leaderboard by type.
 */
export async function getLeaderboard(
  supabase: SupabaseClient,
  type: LeaderboardType,
  limit: number = 20,
  offset: number = 0
): Promise<LeaderboardResult> {
  switch (type) {
    case 'weekly':
      return getWeeklyLeaderboard(supabase, limit, offset)
    case 'monthly':
      return getMonthlyLeaderboard(supabase, limit, offset)
    case 'accuracy':
      return getAccuracyLeaderboard(supabase, limit, offset)
    case 'alltime':
    default:
      return getAllTimeLeaderboard(supabase, limit, offset)
  }
}

/**
 * Update weekly and monthly points for an agent.
 *
 * Call this when awarding points to track time-based stats.
 */
export async function updateTimeBasedPoints(
  agentId: string,
  points: number,
  supabase: SupabaseClient
): Promise<void> {
  // Get current week and month start dates
  const now = new Date()
  const currentWeekStart = getWeekStart(now)
  const currentMonthStart = getMonthStart(now)

  // Get agent's current time tracking info
  const { data: agent } = await supabase
    .from('agents')
    .select('weekly_points, monthly_points, week_start, month_start')
    .eq('id', agentId)
    .single()

  if (!agent) return

  // Determine new values
  let weeklyPoints = agent.weekly_points ?? 0
  let monthlyPoints = agent.monthly_points ?? 0

  // Reset weekly if we're in a new week
  if (agent.week_start !== currentWeekStart) {
    weeklyPoints = 0
  }

  // Reset monthly if we're in a new month
  if (agent.month_start !== currentMonthStart) {
    monthlyPoints = 0
  }

  // Add new points
  weeklyPoints += points
  monthlyPoints += points

  // Update database
  await supabase
    .from('agents')
    .update({
      weekly_points: weeklyPoints,
      monthly_points: monthlyPoints,
      week_start: currentWeekStart,
      month_start: currentMonthStart,
    })
    .eq('id', agentId)
}

/**
 * Get the start of the current week (Monday) in YYYY-MM-DD format.
 */
export function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1) // Adjust when Sunday
  d.setUTCDate(diff)
  return d.toISOString().split('T')[0]
}

/**
 * Get the start of the current month in YYYY-MM-DD format.
 */
export function getMonthStart(date: Date): string {
  const d = new Date(date)
  d.setUTCDate(1)
  return d.toISOString().split('T')[0]
}
