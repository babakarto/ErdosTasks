/**
 * Erdős-Straus Task Generator
 *
 * Generates tasks for the Erdős-Straus conjecture:
 * For every n >= 2, 4/n can be written as 1/x + 1/y + 1/z for positive integers x, y, z.
 */

import type { TaskType, Difficulty, VerificationType } from '@/types/database';
import { randomPrimeInRange, randomBigPrimeInRange, randomChoice, randomIntInRange } from './utils';

export interface GeneratedTask {
  problem: string;
  type: TaskType;
  title: string;
  description: string;
  parameters: Record<string, unknown>;
  difficulty: Difficulty;
  points: number;
  verification_type: VerificationType;
}

interface DifficultyConfig {
  range: [number, number];
  difficulty: Difficulty;
  points: number;
}

const COMPUTE_DIFFICULTIES: DifficultyConfig[] = [
  { range: [100, 10000], difficulty: 'easy', points: 5 },
  { range: [10000, 1000000], difficulty: 'medium', points: 10 },
  { range: [1000000, 1000000000], difficulty: 'hard', points: 20 },
];

/**
 * Generate an Erdős-Straus COMPUTE task.
 * Agent must find x, y, z such that 4/n = 1/x + 1/y + 1/z.
 */
export function generateErdosStrausCompute(
  preferredDifficulty?: Difficulty
): GeneratedTask {
  let config: DifficultyConfig;

  if (preferredDifficulty) {
    const matching = COMPUTE_DIFFICULTIES.find(
      (c) => c.difficulty === preferredDifficulty
    );
    config = matching || randomChoice(COMPUTE_DIFFICULTIES);
  } else {
    config = randomChoice(COMPUTE_DIFFICULTIES);
  }

  const n = randomPrimeInRange(config.range[0], config.range[1]);

  return {
    problem: 'erdos-straus',
    type: 'COMPUTE',
    title: `Find Egyptian fraction for n=${n}`,
    description: `Find positive integers x, y, z such that 4/${n} = 1/x + 1/y + 1/z. The Erdős-Straus conjecture states that such a decomposition exists for all n ≥ 2.`,
    parameters: { n },
    difficulty: config.difficulty,
    points: config.points,
    verification_type: 'automatic',
  };
}

/**
 * Generate an Erdős-Straus VERIFY task.
 * Agent must verify that all primes in a range have solutions.
 */
export function generateErdosStrausVerify(): GeneratedTask {
  // Random range size
  const rangeSize = randomChoice([100, 500, 1000]);

  // Start in a challenging range (above 10^6)
  const start = randomPrimeInRange(1000000, 10000000);
  const end = start + rangeSize;

  return {
    problem: 'erdos-straus',
    type: 'VERIFY',
    title: `Verify primes in [${start}, ${end}] have solutions`,
    description: `Verify that every prime n in the range [${start}, ${end}] has positive integers x, y, z satisfying 4/n = 1/x + 1/y + 1/z. Return the solutions for each prime.`,
    parameters: {
      range_start: start,
      range_end: end,
    },
    difficulty: 'medium',
    points: 15,
    verification_type: 'automatic',
  };
}

/**
 * Generate an Erdős-Straus SEARCH task.
 * Agent must search for a counterexample in a challenging range.
 */
export function generateErdosStrausSearch(): GeneratedTask {
  // Pick a challenging range beyond current verification frontier
  // The conjecture has been verified for all n up to at least 10^17
  const baseStart = 100000000000000000n; // 10^17
  const randomOffset = BigInt(randomIntInRange(0, 1000000));
  const start = baseStart + randomOffset;
  const size = 100000n;
  const end = start + size;

  return {
    problem: 'erdos-straus',
    type: 'SEARCH',
    title: `Search for counterexample in [${start}, ${end}]`,
    description: `Search for any integer n in the range [${start}, ${end}] where 4/n cannot be written as the sum of 3 unit fractions (1/x + 1/y + 1/z). If the conjecture is true, no such n exists.`,
    parameters: {
      range_start: start.toString(),
      range_end: end.toString(),
    },
    difficulty: 'hard',
    points: 50,
    verification_type: 'automatic',
  };
}

/**
 * Generate a random Erdős-Straus task of any type.
 */
export function generateErdosStrausTask(
  taskType?: TaskType,
  difficulty?: Difficulty
): GeneratedTask {
  if (taskType) {
    switch (taskType) {
      case 'COMPUTE':
        return generateErdosStrausCompute(difficulty);
      case 'VERIFY':
        return generateErdosStrausVerify();
      case 'SEARCH':
        return generateErdosStrausSearch();
      default:
        // For unsupported types, default to COMPUTE
        return generateErdosStrausCompute(difficulty);
    }
  }

  // Random type selection with weighted distribution
  // More COMPUTE tasks than VERIFY or SEARCH
  const typeWeights: Array<[TaskType, number]> = [
    ['COMPUTE', 6],
    ['VERIFY', 3],
    ['SEARCH', 1],
  ];

  const totalWeight = typeWeights.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [type, weight] of typeWeights) {
    random -= weight;
    if (random <= 0) {
      return generateErdosStrausTask(type, difficulty);
    }
  }

  // Fallback
  return generateErdosStrausCompute(difficulty);
}
