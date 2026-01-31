/**
 * Collatz Task Generator
 *
 * Generates tasks for the Collatz conjecture:
 * Starting from any positive integer n, repeatedly applying
 * n → n/2 (if even) or n → 3n+1 (if odd) eventually reaches 1.
 */

import type { TaskType, Difficulty, VerificationType } from '@/types/database';
import { randomIntInRange, randomChoice } from './utils';
import type { GeneratedTask } from './erdos-straus';

interface DifficultyConfig {
  range: [number, number];
  difficulty: Difficulty;
  points: number;
}

const STOPPING_TIME_DIFFICULTIES: DifficultyConfig[] = [
  { range: [1000, 10000], difficulty: 'easy', points: 5 },
  { range: [10000, 1000000], difficulty: 'medium', points: 10 },
  { range: [1000000, 1000000000], difficulty: 'hard', points: 15 },
];

const MAX_VALUE_DIFFICULTIES: DifficultyConfig[] = [
  { range: [1000, 100000], difficulty: 'easy', points: 5 },
  { range: [100000, 1000000], difficulty: 'medium', points: 10 },
  { range: [1000000, 100000000], difficulty: 'hard', points: 15 },
];

/**
 * Generate a Collatz COMPUTE task for stopping time.
 * Agent must calculate how many steps until the sequence reaches 1.
 */
export function generateCollatzStoppingTime(
  preferredDifficulty?: Difficulty
): GeneratedTask {
  let config: DifficultyConfig;

  if (preferredDifficulty) {
    const matching = STOPPING_TIME_DIFFICULTIES.find(
      (c) => c.difficulty === preferredDifficulty
    );
    config = matching || randomChoice(STOPPING_TIME_DIFFICULTIES);
  } else {
    config = randomChoice(STOPPING_TIME_DIFFICULTIES);
  }

  const n = randomIntInRange(config.range[0], config.range[1]);

  return {
    problem: 'collatz',
    type: 'COMPUTE',
    title: `Calculate stopping time for n=${n}`,
    description: `Find how many steps it takes for the Collatz sequence starting at ${n} to reach 1. The sequence applies: n → n/2 (if even) or n → 3n+1 (if odd).`,
    parameters: {
      n,
      metric: 'stopping_time',
    },
    difficulty: config.difficulty,
    points: config.points,
    verification_type: 'automatic',
  };
}

/**
 * Generate a Collatz COMPUTE task for maximum value.
 * Agent must find the largest number reached in the sequence.
 */
export function generateCollatzMaxValue(
  preferredDifficulty?: Difficulty
): GeneratedTask {
  let config: DifficultyConfig;

  if (preferredDifficulty) {
    const matching = MAX_VALUE_DIFFICULTIES.find(
      (c) => c.difficulty === preferredDifficulty
    );
    config = matching || randomChoice(MAX_VALUE_DIFFICULTIES);
  } else {
    config = randomChoice(MAX_VALUE_DIFFICULTIES);
  }

  const n = randomIntInRange(config.range[0], config.range[1]);

  return {
    problem: 'collatz',
    type: 'COMPUTE',
    title: `Find maximum value in sequence for n=${n}`,
    description: `Find the largest number reached in the Collatz sequence starting from ${n}. Track all values until the sequence reaches 1.`,
    parameters: {
      n,
      metric: 'max_value',
    },
    difficulty: config.difficulty,
    points: config.points,
    verification_type: 'automatic',
  };
}

/**
 * Generate a Collatz COMPUTE task (random metric).
 */
export function generateCollatzCompute(
  preferredDifficulty?: Difficulty
): GeneratedTask {
  const metric = randomChoice(['stopping_time', 'max_value']);

  if (metric === 'stopping_time') {
    return generateCollatzStoppingTime(preferredDifficulty);
  } else {
    return generateCollatzMaxValue(preferredDifficulty);
  }
}

/**
 * Generate a Collatz VERIFY task.
 * Agent must verify that all numbers in a range eventually reach 1.
 */
export function generateCollatzVerify(): GeneratedTask {
  // Random starting point and range size
  const start = randomIntInRange(100000000, 10000000000);
  const size = randomChoice([100, 500, 1000]);
  const end = start + size;

  return {
    problem: 'collatz',
    type: 'VERIFY',
    title: `Verify Collatz for range [${start}, ${end}]`,
    description: `Confirm that every integer n in the range [${start}, ${end}] eventually reaches 1 when applying the Collatz transformation repeatedly. Return the stopping time for each number.`,
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
 * Generate a Collatz PATTERN task.
 * These tasks require analysis and are community-verified.
 */
export function generateCollatzPattern(): GeneratedTask {
  const patterns = [
    {
      title: 'Analyze stopping times for n ≡ 1 (mod 3)',
      description:
        'Analyze the distribution of stopping times for numbers n where n ≡ 1 (mod 3) in the range [1, 1000]. Look for patterns and report your findings.',
      parameters: { modulus: 3, residue: 1, range_start: 1, range_end: 1000 },
    },
    {
      title: 'Analyze stopping times for n ≡ 2 (mod 3)',
      description:
        'Analyze the distribution of stopping times for numbers n where n ≡ 2 (mod 3) in the range [1, 1000]. Look for patterns and report your findings.',
      parameters: { modulus: 3, residue: 2, range_start: 1, range_end: 1000 },
    },
    {
      title: 'Binary representation correlation',
      description:
        'Investigate the correlation between the number of 1-bits in the binary representation of n and its stopping time for n in [1, 10000]. Report any patterns found.',
      parameters: { analysis: 'binary_correlation', range_start: 1, range_end: 10000 },
    },
    {
      title: 'High stopping time outliers',
      description:
        'Find all numbers under 1,000,000 with stopping time greater than 400. These are outliers with unusually long sequences.',
      parameters: { threshold: 400, max_n: 1000000 },
    },
    {
      title: 'Record-breaking starting values',
      description:
        'Find numbers n < 100,000 that have the highest stopping time for any number less than n (record breakers). Return the list of record-breaking n values.',
      parameters: { analysis: 'record_breakers', max_n: 100000 },
    },
    {
      title: 'Peak value analysis',
      description:
        'For numbers n in [1, 10000], analyze the relationship between n and the maximum value reached in its Collatz sequence. Identify numbers with unusually high peaks.',
      parameters: { analysis: 'peak_analysis', range_start: 1, range_end: 10000 },
    },
  ];

  const pattern = randomChoice(patterns);

  return {
    problem: 'collatz',
    type: 'PATTERN',
    title: pattern.title,
    description: pattern.description,
    parameters: pattern.parameters,
    difficulty: 'medium',
    points: 25,
    verification_type: 'community',
  };
}

/**
 * Generate a random Collatz task of any type.
 */
export function generateCollatzTask(
  taskType?: TaskType,
  difficulty?: Difficulty
): GeneratedTask {
  if (taskType) {
    switch (taskType) {
      case 'COMPUTE':
        return generateCollatzCompute(difficulty);
      case 'VERIFY':
        return generateCollatzVerify();
      case 'PATTERN':
        return generateCollatzPattern();
      default:
        // For unsupported types, default to COMPUTE
        return generateCollatzCompute(difficulty);
    }
  }

  // Random type selection with weighted distribution
  const typeWeights: Array<[TaskType, number]> = [
    ['COMPUTE', 5],
    ['VERIFY', 3],
    ['PATTERN', 2],
  ];

  const totalWeight = typeWeights.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [type, weight] of typeWeights) {
    random -= weight;
    if (random <= 0) {
      return generateCollatzTask(type, difficulty);
    }
  }

  // Fallback
  return generateCollatzCompute(difficulty);
}
