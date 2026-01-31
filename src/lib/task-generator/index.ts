/**
 * Task Generator Central Router
 *
 * Routes task generation to problem-specific generators.
 * Handles task pool maintenance and duplicate detection.
 */

import type { TaskType, Difficulty } from '@/types/database';
import { generateErdosStrausTask, type GeneratedTask } from './erdos-straus';
import { generateCollatzTask } from './collatz';
import { generateSidonTask } from './sidon';
import { randomChoice } from './utils';

// Re-export types and utility functions
export type { GeneratedTask } from './erdos-straus';
export * from './utils';

// Supported problems
export const SUPPORTED_PROBLEMS = ['erdos-straus', 'collatz', 'sidon'] as const;
export type SupportedProblem = (typeof SUPPORTED_PROBLEMS)[number];

/**
 * Check if a problem slug is supported.
 */
export function isSupportedProblem(problem: string): problem is SupportedProblem {
  return SUPPORTED_PROBLEMS.includes(problem as SupportedProblem);
}

/**
 * Generate a task for a specific problem.
 */
export function generateTaskForProblem(
  problem: SupportedProblem,
  taskType?: TaskType,
  difficulty?: Difficulty
): GeneratedTask {
  switch (problem) {
    case 'erdos-straus':
      return generateErdosStrausTask(taskType, difficulty);
    case 'collatz':
      return generateCollatzTask(taskType, difficulty);
    case 'sidon':
      return generateSidonTask(taskType, difficulty);
    default:
      throw new Error(`Unsupported problem: ${problem}`);
  }
}

/**
 * Generate a random task from any problem.
 */
export function generateRandomTask(
  taskType?: TaskType,
  difficulty?: Difficulty
): GeneratedTask {
  const problem = randomChoice([...SUPPORTED_PROBLEMS]);
  return generateTaskForProblem(problem, taskType, difficulty);
}

/**
 * Options for batch task generation.
 */
export interface GenerateTasksOptions {
  /** Specific problem to generate for (random if not specified) */
  problem?: SupportedProblem;
  /** Specific task type (random if not specified) */
  type?: TaskType;
  /** Specific difficulty (random if not specified) */
  difficulty?: Difficulty;
  /** Number of tasks to generate */
  count: number;
  /** Existing task parameters to check for duplicates */
  existingParameters?: Set<string>;
}

/**
 * Generate multiple tasks with duplicate detection.
 */
export function generateTasks(options: GenerateTasksOptions): GeneratedTask[] {
  const { problem, type, difficulty, count, existingParameters } = options;

  const generated: GeneratedTask[] = [];
  const seenParameters = new Set<string>(existingParameters);

  // Maximum attempts to avoid infinite loops
  const maxAttempts = count * 10;
  let attempts = 0;

  while (generated.length < count && attempts < maxAttempts) {
    attempts++;

    // Generate a task
    const task = problem
      ? generateTaskForProblem(problem, type, difficulty)
      : generateRandomTask(type, difficulty);

    // Create a unique key for duplicate detection
    const paramKey = createParameterKey(task);

    // Check for duplicates
    if (!seenParameters.has(paramKey)) {
      seenParameters.add(paramKey);
      generated.push(task);
    }
  }

  return generated;
}

/**
 * Create a unique key from task parameters for duplicate detection.
 */
function createParameterKey(task: GeneratedTask): string {
  return `${task.problem}:${task.type}:${JSON.stringify(task.parameters)}`;
}

/**
 * Get a balanced distribution of tasks across problems.
 */
export function generateBalancedTasks(
  count: number,
  existingParameters?: Set<string>
): GeneratedTask[] {
  const perProblem = Math.ceil(count / SUPPORTED_PROBLEMS.length);
  const tasks: GeneratedTask[] = [];

  for (const problem of SUPPORTED_PROBLEMS) {
    const problemTasks = generateTasks({
      problem,
      count: perProblem,
      existingParameters,
    });
    tasks.push(...problemTasks);
  }

  // Trim to exact count and shuffle
  return shuffleArray(tasks).slice(0, count);
}

/**
 * Generate tasks with balanced difficulty distribution.
 */
export function generateDifficultyBalancedTasks(
  count: number,
  existingParameters?: Set<string>
): GeneratedTask[] {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  const perDifficulty = Math.ceil(count / difficulties.length);
  const tasks: GeneratedTask[] = [];

  for (const difficulty of difficulties) {
    const difficultyTasks = generateTasks({
      difficulty,
      count: perDifficulty,
      existingParameters,
    });
    tasks.push(...difficultyTasks);
  }

  // Trim to exact count and shuffle
  return shuffleArray(tasks).slice(0, count);
}

/**
 * Shuffle an array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Re-export individual generators for direct use
export { generateErdosStrausTask } from './erdos-straus';
export { generateCollatzTask } from './collatz';
export { generateSidonTask } from './sidon';
