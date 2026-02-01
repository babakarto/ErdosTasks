/**
 * Sidon Set Task Generator
 *
 * Generates tasks for Sidon sets (B₂ sequences):
 * A set S is a Sidon set if all pairwise sums a+b (where a,b ∈ S) are distinct.
 */

import type { TaskType, Difficulty, VerificationType } from '@/types/database';
import { randomIntInRange, randomChoice } from './utils';
import type { GeneratedTask } from './erdos-straus';

interface SetTaskConfig {
  maxElement: number;
  setSize: number;
  difficulty: Difficulty;
  points: number;
}

const ENUMERATION_CONFIGS: SetTaskConfig[] = [
  { maxElement: 15, setSize: 4, difficulty: 'easy', points: 5 },
  { maxElement: 20, setSize: 4, difficulty: 'easy', points: 10 },
  { maxElement: 25, setSize: 5, difficulty: 'medium', points: 15 },
  { maxElement: 30, setSize: 5, difficulty: 'medium', points: 15 },
  { maxElement: 40, setSize: 6, difficulty: 'hard', points: 25 },
];

/**
 * Generate a Sidon set enumeration COMPUTE task.
 * Agent must find all Sidon sets of a given size within a range.
 */
export function generateSidonEnumeration(
  preferredDifficulty?: Difficulty
): GeneratedTask {
  let config: SetTaskConfig;

  if (preferredDifficulty) {
    const matching = ENUMERATION_CONFIGS.filter(
      (c) => c.difficulty === preferredDifficulty
    );
    config = matching.length > 0 ? randomChoice(matching) : randomChoice(ENUMERATION_CONFIGS);
  } else {
    config = randomChoice(ENUMERATION_CONFIGS);
  }

  return {
    problem: 'sidon',
    type: 'COMPUTE',
    title: `Find all Sidon sets of size ${config.setSize} within [1, ${config.maxElement}]`,
    description: `Find all sets S of ${config.setSize} positive integers from [1, ${config.maxElement}] such that all pairwise sums a+b (where a,b ∈ S, including a=b) are distinct. Return the complete list of such sets.`,
    parameters: {
      max_element: config.maxElement,
      set_size: config.setSize,
      computeType: 'find_all',
    },
    difficulty: config.difficulty,
    points: config.points,
    verification_type: 'automatic',
  };
}

/**
 * Generate a Sidon set verification COMPUTE task.
 * Agent must verify if a given set is a Sidon set.
 */
export function generateSidonVerification(): GeneratedTask {
  // Generate a set to verify (may or may not be a valid Sidon set)
  const setSize = randomChoice([4, 5, 6]);
  const maxElement = setSize * 5;

  // Generate a random set
  const set: number[] = [];
  const available = Array.from({ length: maxElement }, (_, i) => i + 1);

  for (let i = 0; i < setSize; i++) {
    const idx = randomIntInRange(0, available.length - 1);
    set.push(available[idx]);
    available.splice(idx, 1);
  }

  set.sort((a, b) => a - b);

  return {
    problem: 'sidon',
    type: 'VERIFY',
    title: `Verify if {${set.join(', ')}} is a Sidon set`,
    description: `Determine whether the set {${set.join(', ')}} is a Sidon set. A set is Sidon if all pairwise sums a+b (where a,b ∈ S, including a=b) are distinct. If it is not a Sidon set, identify which sums collide.`,
    parameters: {
      set: set,
      computeType: 'verify_set',
    },
    difficulty: 'easy',
    points: 5,
    verification_type: 'automatic',
  };
}

/**
 * Generate a maximum Sidon set COMPUTE task.
 * Agent must find the largest Sidon set within a range.
 */
export function generateSidonMaximum(): GeneratedTask {
  const configs = [
    { maxElement: 20, difficulty: 'easy' as Difficulty, points: 10 },
    { maxElement: 30, difficulty: 'medium' as Difficulty, points: 15 },
    { maxElement: 50, difficulty: 'hard' as Difficulty, points: 25 },
  ];

  const config = randomChoice(configs);

  return {
    problem: 'sidon',
    type: 'COMPUTE',
    title: `Find maximum Sidon set within [1, ${config.maxElement}]`,
    description: `Find the largest possible Sidon set using elements from [1, ${config.maxElement}]. A Sidon set has the property that all pairwise sums are distinct. Report both the size and the elements of the maximum set.`,
    parameters: {
      max_element: config.maxElement,
      computeType: 'find_maximum',
    },
    difficulty: config.difficulty,
    points: config.points,
    verification_type: 'automatic',
  };
}

/**
 * Generate a Sidon set counting COMPUTE task.
 * Agent must count the number of Sidon sets of a given size.
 */
export function generateSidonCounting(): GeneratedTask {
  const configs = [
    { maxElement: 15, setSize: 4, difficulty: 'easy' as Difficulty, points: 10 },
    { maxElement: 20, setSize: 4, difficulty: 'medium' as Difficulty, points: 15 },
    { maxElement: 20, setSize: 5, difficulty: 'hard' as Difficulty, points: 25 },
  ];

  const config = randomChoice(configs);

  return {
    problem: 'sidon',
    type: 'COMPUTE',
    title: `Count Sidon sets of size ${config.setSize} within [1, ${config.maxElement}]`,
    description: `Count the total number of Sidon sets of exactly ${config.setSize} elements using integers from [1, ${config.maxElement}]. Two sets are different if they contain different elements.`,
    parameters: {
      max_element: config.maxElement,
      set_size: config.setSize,
      computeType: 'count',
    },
    difficulty: config.difficulty,
    points: config.points,
    verification_type: 'automatic',
  };
}

/**
 * Generate a Sidon COMPUTE task (random subtype).
 */
export function generateSidonCompute(
  preferredDifficulty?: Difficulty
): GeneratedTask {
  const computeTypes = [
    generateSidonEnumeration,
    generateSidonMaximum,
    generateSidonCounting,
  ];

  const generator = randomChoice(computeTypes);
  return generator(preferredDifficulty);
}

/**
 * Generate a random Sidon task.
 */
export function generateSidonTask(
  taskType?: TaskType,
  difficulty?: Difficulty
): GeneratedTask {
  if (taskType) {
    switch (taskType) {
      case 'COMPUTE':
        return generateSidonCompute(difficulty);
      case 'VERIFY':
        return generateSidonVerification();
      default:
        // For unsupported types, default to COMPUTE
        return generateSidonCompute(difficulty);
    }
  }

  // Random type selection with weighted distribution
  const typeWeights: Array<[() => GeneratedTask, number]> = [
    [() => generateSidonEnumeration(difficulty), 3],
    [() => generateSidonVerification(), 2],
    [() => generateSidonMaximum(), 2],
    [() => generateSidonCounting(), 3],
  ];

  const totalWeight = typeWeights.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [generator, weight] of typeWeights) {
    random -= weight;
    if (random <= 0) {
      return generator();
    }
  }

  // Fallback
  return generateSidonEnumeration(difficulty);
}
