/**
 * Streak Tracking System
 *
 * Tracks daily and accuracy streaks for agents.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Agent streak data from database.
 */
export interface AgentStreaks {
  daily_streak: number
  daily_streak_last: string | null
  accuracy_streak: number
  best_daily_streak: number
  best_accuracy_streak: number
}

/**
 * Result of streak update.
 */
export interface StreakUpdateResult {
  /** Updated daily streak value */
  dailyStreak: number
  /** Whether daily streak increased */
  dailyStreakIncreased: boolean
  /** Whether a new best daily streak was achieved */
  newBestDailyStreak: boolean
  /** Updated accuracy streak value */
  accuracyStreak: number
  /** Whether accuracy streak increased */
  accuracyStreakIncreased: boolean
  /** Whether a new best accuracy streak was achieved */
  newBestAccuracyStreak: boolean
}

/**
 * Get the date string for today in YYYY-MM-DD format (UTC).
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get the date string for yesterday in YYYY-MM-DD format (UTC).
 */
export function getYesterday(): string {
  const yesterday = new Date()
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

/**
 * Update streaks after a submission.
 *
 * Daily streak:
 * - Increments if last activity was yesterday
 * - Resets to 1 if last activity was before yesterday (or never)
 * - Stays the same if last activity was today (already counted)
 *
 * Accuracy streak:
 * - Increments on verified submission
 * - Resets to 0 on rejected submission
 */
export async function updateStreaks(
  agentId: string,
  submissionResult: 'verified' | 'rejected',
  supabase: SupabaseClient
): Promise<StreakUpdateResult> {
  // Get current streak data
  const { data: agent, error } = await supabase
    .from('agents')
    .select('daily_streak, daily_streak_last, accuracy_streak, best_daily_streak, best_accuracy_streak')
    .eq('id', agentId)
    .single()

  if (error || !agent) {
    console.error('Failed to get agent streaks:', error)
    return {
      dailyStreak: 0,
      dailyStreakIncreased: false,
      newBestDailyStreak: false,
      accuracyStreak: 0,
      accuracyStreakIncreased: false,
      newBestAccuracyStreak: false,
    }
  }

  const today = getToday()
  const yesterday = getYesterday()

  // Current values
  let dailyStreak = agent.daily_streak ?? 0
  let accuracyStreak = agent.accuracy_streak ?? 0
  let bestDailyStreak = agent.best_daily_streak ?? 0
  let bestAccuracyStreak = agent.best_accuracy_streak ?? 0
  const lastStreakDate = agent.daily_streak_last

  // Track changes
  let dailyStreakIncreased = false
  let newBestDailyStreak = false
  let accuracyStreakIncreased = false
  let newBestAccuracyStreak = false

  if (submissionResult === 'verified') {
    // Update daily streak
    if (lastStreakDate === yesterday) {
      // Continue streak from yesterday
      dailyStreak += 1
      dailyStreakIncreased = true
    } else if (lastStreakDate !== today) {
      // Start new streak (either first submission or streak was broken)
      dailyStreak = 1
      dailyStreakIncreased = lastStreakDate === null || lastStreakDate < yesterday
    }
    // If lastStreakDate === today, don't increment (already counted today)

    // Update best daily streak
    if (dailyStreak > bestDailyStreak) {
      bestDailyStreak = dailyStreak
      newBestDailyStreak = true
    }

    // Update accuracy streak
    accuracyStreak += 1
    accuracyStreakIncreased = true

    // Update best accuracy streak
    if (accuracyStreak > bestAccuracyStreak) {
      bestAccuracyStreak = accuracyStreak
      newBestAccuracyStreak = true
    }

    // Save to database
    await supabase
      .from('agents')
      .update({
        daily_streak: dailyStreak,
        daily_streak_last: today,
        accuracy_streak: accuracyStreak,
        best_daily_streak: bestDailyStreak,
        best_accuracy_streak: bestAccuracyStreak,
      })
      .eq('id', agentId)
  } else {
    // Rejected submission - reset accuracy streak
    accuracyStreak = 0

    // Save to database (only accuracy streak changes on rejection)
    await supabase
      .from('agents')
      .update({
        accuracy_streak: 0,
      })
      .eq('id', agentId)
  }

  return {
    dailyStreak,
    dailyStreakIncreased,
    newBestDailyStreak,
    accuracyStreak,
    accuracyStreakIncreased,
    newBestAccuracyStreak,
  }
}

/**
 * Format streak message for display.
 */
export function formatStreakMessage(result: StreakUpdateResult): string {
  const parts: string[] = []

  if (result.dailyStreakIncreased) {
    parts.push(`🔥 ${result.dailyStreak} day streak`)
  }

  if (result.accuracyStreakIncreased && result.accuracyStreak >= 5) {
    parts.push(`🎯 ${result.accuracyStreak} in a row`)
  }

  if (result.newBestDailyStreak && result.dailyStreak > 1) {
    parts.push(`New personal best daily streak!`)
  }

  if (result.newBestAccuracyStreak && result.accuracyStreak > 5) {
    parts.push(`New personal best accuracy streak!`)
  }

  return parts.join(' ')
}

/**
 * Get streak display info for agent profile.
 */
export function getStreakDisplay(streaks: AgentStreaks): {
  currentDailyStreak: number
  currentAccuracyStreak: number
  bestDailyStreak: number
  bestAccuracyStreak: number
  isActive: boolean
} {
  const today = getToday()
  const yesterday = getYesterday()

  // Check if daily streak is still active (last activity was today or yesterday)
  const isActive =
    streaks.daily_streak_last === today || streaks.daily_streak_last === yesterday

  return {
    currentDailyStreak: isActive ? streaks.daily_streak : 0,
    currentAccuracyStreak: streaks.accuracy_streak,
    bestDailyStreak: streaks.best_daily_streak,
    bestAccuracyStreak: streaks.best_accuracy_streak,
    isActive,
  }
}
