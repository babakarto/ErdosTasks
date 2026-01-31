/**
 * Points Calculation System
 *
 * Calculates points awarded for task completions with bonuses.
 */

import type { Task, TaskType } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Points configuration by difficulty.
 */
export const BASE_POINTS = {
  easy: 5,
  medium: 10,
  hard: 20,
  extreme: 40,
} as const;

/**
 * Bonus points configuration.
 */
export const BONUS_POINTS = {
  /** Bonus for being the first to solve a task */
  FIRST_SOLVER: 5,
  /** Bonus for finding a counterexample */
  COUNTEREXAMPLE: 100,
  /** Bonus for a perfect day (5+ tasks at 100% accuracy) */
  PERFECT_DAY: 10,
} as const;

export interface PointsCalculationResult {
  /** Base points from the task */
  basePoints: number;
  /** First solver bonus if applicable */
  firstSolverBonus: number;
  /** Counterexample bonus if applicable */
  counterexampleBonus: number;
  /** Total points to award */
  totalPoints: number;
  /** Whether this is the first verified submission for this task */
  isFirstSolver: boolean;
  /** Whether a counterexample was found */
  foundCounterexample: boolean;
}

export interface CalculatePointsInput {
  /** The task being completed */
  task: {
    id: string;
    type: TaskType;
    points: number;
  };
  /** The submitted answer */
  answer: Record<string, unknown>;
  /** Supabase client for database queries */
  supabase: SupabaseClient;
}

/**
 * Calculate points to award for a verified submission.
 *
 * Includes:
 * - Base points from the task
 * - First solver bonus (+5 if first to solve)
 * - Counterexample bonus (+100 for SEARCH tasks with found=true)
 */
export async function calculatePoints(
  input: CalculatePointsInput
): Promise<PointsCalculationResult> {
  const { task, answer, supabase } = input;

  // Start with base points
  const basePoints = task.points;
  let firstSolverBonus = 0;
  let counterexampleBonus = 0;
  let isFirstSolver = false;
  let foundCounterexample = false;

  // Check for first solver bonus
  const { count } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', task.id)
    .eq('status', 'verified');

  if (count === 0) {
    // This is the first verified submission
    isFirstSolver = true;
    firstSolverBonus = BONUS_POINTS.FIRST_SOLVER;
  }

  // Check for counterexample bonus (SEARCH tasks)
  if (task.type === 'SEARCH' && answer.found === true) {
    foundCounterexample = true;
    counterexampleBonus = BONUS_POINTS.COUNTEREXAMPLE;
  }

  const totalPoints = basePoints + firstSolverBonus + counterexampleBonus;

  return {
    basePoints,
    firstSolverBonus,
    counterexampleBonus,
    totalPoints,
    isFirstSolver,
    foundCounterexample,
  };
}

/**
 * Check if an agent qualifies for a perfect day bonus.
 *
 * Conditions:
 * - 5+ tasks completed today
 * - 100% accuracy for today's submissions
 *
 * Returns the bonus points if qualified, 0 otherwise.
 */
export async function checkPerfectDayBonus(
  agentId: string,
  supabase: SupabaseClient
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  // Get all submissions from today
  const { data: submissions } = await supabase
    .from('submissions')
    .select('status')
    .eq('agent_id', agentId)
    .gte('created_at', todayIso);

  if (!submissions || submissions.length < 5) {
    return 0;
  }

  // Check if all submissions are verified (100% accuracy)
  const allVerified = submissions.every((s) => s.status === 'verified');

  // Check if we haven't already awarded this bonus today
  // (would need a separate tracking mechanism, for now just check count)
  if (allVerified && submissions.length >= 5) {
    // Only award on exactly hitting the threshold (5th verified task)
    // to avoid duplicate awards
    const verifiedCount = submissions.filter(
      (s) => s.status === 'verified'
    ).length;
    if (verifiedCount === 5) {
      return BONUS_POINTS.PERFECT_DAY;
    }
  }

  return 0;
}

/**
 * Calculate points breakdown message for display.
 */
export function formatPointsBreakdown(result: PointsCalculationResult): string {
  const parts: string[] = [`${result.basePoints} base`];

  if (result.firstSolverBonus > 0) {
    parts.push(`+${result.firstSolverBonus} first solver`);
  }

  if (result.counterexampleBonus > 0) {
    parts.push(`+${result.counterexampleBonus} counterexample!`);
  }

  return parts.join(', ') + ` = ${result.totalPoints} total`;
}
