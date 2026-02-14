// Verification Router
// Routes submissions to the appropriate verifier based on problem slug

import { verifyErdosStraus, type ErdosStrausInput } from './erdos-straus'
import {
  verifyCollatzStoppingTime,
  verifyCollatzMaxValue,
  verifyCollatzSequence,
  verifyCollatzRange,
} from './collatz'
import { verifySidonSet, findAllSidonSets, countSidonSets, findMaxSidonSet } from './sidon'
import type { TaskType } from '@/types/database'

export interface VerificationResult {
  verified: boolean
  message: string
  points?: number
}

export interface VerificationInput {
  problemSlug: string
  taskType: TaskType
  parameters: Record<string, unknown>
  answer: Record<string, unknown>
}

/**
 * Main verification router.
 * Routes to the appropriate verifier based on problem slug and task type.
 */
export function verify(input: VerificationInput): VerificationResult {
  const { problemSlug, taskType, parameters, answer } = input

  try {
    switch (problemSlug) {
      case 'erdos-straus':
        return verifyErdosStrausTask(taskType, parameters, answer)

      case 'collatz':
        return verifyCollatzTask(taskType, parameters, answer)

      case 'sidon':
        return verifySidonTask(taskType, parameters, answer)

      default:
        return {
          verified: false,
          message: `Unknown problem: ${problemSlug}`,
        }
    }
  } catch (error) {
    return {
      verified: false,
      message: `Verification error: ${error instanceof Error ? error.message : 'unknown error'}`,
    }
  }
}

function verifyErdosStrausTask(
  taskType: TaskType,
  parameters: Record<string, unknown>,
  answer: Record<string, unknown>
): VerificationResult {
  if (taskType === 'COMPUTE') {
    // Answer should contain x, y, z for the given n
    const n = parameters.n as number | string
    const { x, y, z } = answer as { x: number | string; y: number | string; z: number | string }

    if (x === undefined || y === undefined || z === undefined) {
      return {
        verified: false,
        message: 'Answer must contain x, y, z values',
      }
    }

    const result = verifyErdosStraus({ n, x, y, z } as ErdosStrausInput)

    return {
      verified: result.valid,
      message: result.valid
        ? `Correct! ${result.equation}`
        : result.error || 'Invalid solution',
    }
  }

  if (taskType === 'VERIFY') {
    // Verify all primes in a range have solutions
    const rangeStart = parameters.rangeStart as number
    const rangeEnd = parameters.rangeEnd as number
    const solutions = answer.solutions as Array<{ n: number; x: number; y: number; z: number }>

    if (!Array.isArray(solutions)) {
      return {
        verified: false,
        message: 'Answer must contain solutions array',
      }
    }

    // Verify each solution
    for (const sol of solutions) {
      const result = verifyErdosStraus(sol)
      if (!result.valid) {
        return {
          verified: false,
          message: `Invalid solution for n=${sol.n}: ${result.error}`,
        }
      }
    }

    // Check that all primes in range are covered
    const coveredN = new Set(solutions.map(s => s.n))
    for (let n = rangeStart; n <= rangeEnd; n++) {
      if (isPrime(n) && !coveredN.has(n)) {
        return {
          verified: false,
          message: `Missing solution for prime n=${n}`,
        }
      }
    }

    return {
      verified: true,
      message: `All ${solutions.length} solutions verified for range [${rangeStart}, ${rangeEnd}]`,
    }
  }

  if (taskType === 'SEARCH') {
    // Search for counterexample
    const foundCounterexample = answer.foundCounterexample as boolean
    const counterexampleN = answer.counterexampleN as number | undefined

    if (foundCounterexample && counterexampleN !== undefined) {
      // Verify it's actually a counterexample (no solution exists)
      // This would require exhaustive search which is expensive
      // For now, return that we need manual verification
      return {
        verified: false,
        message: 'Counterexample claims require manual verification',
      }
    }

    // If no counterexample found, that's a valid "negative" result
    return {
      verified: true,
      message: 'Search completed, no counterexample found in range',
    }
  }

  return {
    verified: false,
    message: `Unsupported task type for Erdos-Straus: ${taskType}`,
  }
}

function verifyCollatzTask(
  taskType: TaskType,
  parameters: Record<string, unknown>,
  answer: Record<string, unknown>
): VerificationResult {
  if (taskType === 'COMPUTE') {
    const computeType = resolveComputeType(parameters)
    const n = parameters.n as number | string

    if (computeType === 'stopping_time') {
      const stoppingTime = (answer.stoppingTime ?? answer.stopping_time) as number
      if (typeof stoppingTime !== 'number') {
        return {
          verified: false,
          message: 'Answer must contain stoppingTime (number)',
        }
      }

      const result = verifyCollatzStoppingTime(n, stoppingTime)
      return {
        verified: result.valid,
        message: result.valid
          ? `Correct! Stopping time for ${n} is ${stoppingTime}`
          : result.error || 'Invalid stopping time',
      }
    }

    if (computeType === 'max_value') {
      const maxValue = (answer.maxValue ?? answer.max_value) as number | string
      if (maxValue === undefined) {
        return {
          verified: false,
          message: 'Answer must contain maxValue',
        }
      }

      const result = verifyCollatzMaxValue(n, maxValue)
      return {
        verified: result.valid,
        message: result.valid
          ? `Correct! Max value for ${n} is ${maxValue}`
          : result.error || 'Invalid max value',
      }
    }

    if (computeType === 'sequence') {
      const sequence = answer.sequence as (number | string)[]
      if (!Array.isArray(sequence)) {
        return {
          verified: false,
          message: 'Answer must contain sequence array',
        }
      }

      const result = verifyCollatzSequence(n, sequence)
      return {
        verified: result.valid,
        message: result.valid
          ? `Correct! Sequence for ${n} verified`
          : result.error || 'Invalid sequence',
      }
    }

    return {
      verified: false,
      message: `Unknown compute type: ${computeType}`,
    }
  }

  if (taskType === 'VERIFY') {
    const rangeStart = (parameters.rangeStart ?? parameters.range_start) as number | string
    const rangeEnd = (parameters.rangeEnd ?? parameters.range_end) as number | string
    const allReach1 = (answer.allReach1 ?? answer.all_reach_1) as boolean

    if (typeof allReach1 !== 'boolean') {
      return {
        verified: false,
        message: 'Answer must contain allReach1 (boolean)',
      }
    }

    const result = verifyCollatzRange(rangeStart, rangeEnd, allReach1)
    return {
      verified: result.valid,
      message: result.valid
        ? `Correct! Range [${rangeStart}, ${rangeEnd}] verification confirmed`
        : result.error || 'Invalid range verification',
    }
  }

  if (taskType === 'PATTERN') {
    // Pattern tasks require community verification
    return {
      verified: false,
      message: 'Pattern analysis requires community verification',
    }
  }

  return {
    verified: false,
    message: `Unsupported task type for Collatz: ${taskType}`,
  }
}

/** Normalize compute type across old seed (operation) and new generator (computeType) naming */
function resolveComputeType(parameters: Record<string, unknown>): string | undefined {
  const raw = (parameters.computeType ?? parameters.operation ?? parameters.metric ?? parameters.compute_type) as string | undefined
  if (!raw) return undefined
  // Map old seed names to current verifier names
  const aliases: Record<string, string> = {
    verify: 'verify_set',
    verify_maximal: 'verify_set',
    enumerate: 'find_all',
  }
  return aliases[raw] ?? raw
}

function verifySidonTask(
  taskType: TaskType,
  parameters: Record<string, unknown>,
  answer: Record<string, unknown>
): VerificationResult {
  // Route by computeType if present (works for both COMPUTE and VERIFY task types)
  // Infer computeType from parameters when not explicitly set
  let computeType = resolveComputeType(parameters)
  if (!computeType) {
    if (parameters.set && !parameters.max_element && !parameters.set_size) {
      computeType = 'verify_set'
    } else if (parameters.set_size && parameters.max_element) {
      computeType = 'find_all'
    } else if (parameters.max_element && !parameters.set_size) {
      computeType = 'find_maximum'
    }
  }

  if (computeType) {
    if (computeType === 'verify_set') {
      // The task provides a set in parameters, bot must determine if it's a Sidon set
      const taskSet = parameters.set as number[]
      if (!Array.isArray(taskSet)) {
        return {
          verified: false,
          message: 'Task parameters missing set array',
        }
      }

      // Bot should answer with {is_sidon: boolean} or {isSidon: boolean}
      const botAnswer = (answer.is_sidon ?? answer.isSidon) as boolean
      if (typeof botAnswer !== 'boolean') {
        return {
          verified: false,
          message: 'Answer must contain is_sidon boolean',
        }
      }

      // Compute the actual result
      const result = verifySidonSet(taskSet)
      const isActuallySidon = result.valid

      if (botAnswer === isActuallySidon) {
        return {
          verified: true,
          message: isActuallySidon
            ? `Correct! Set [${taskSet.join(', ')}] is a valid Sidon set`
            : `Correct! Set [${taskSet.join(', ')}] is NOT a Sidon set: ${result.error}`,
        }
      } else {
        return {
          verified: false,
          message: botAnswer
            ? `Wrong! Set [${taskSet.join(', ')}] is NOT a Sidon set: ${result.error}`
            : `Wrong! Set [${taskSet.join(', ')}] IS a valid Sidon set`,
        }
      }
    }

    if (computeType === 'find_all') {
      const maxElement = (parameters.max_element ?? parameters.maxElement) as number
      const setSize = (parameters.set_size ?? parameters.setSize) as number
      const sets = answer.sets as number[][]

      if (!Array.isArray(sets)) {
        return {
          verified: false,
          message: 'Answer must contain sets array',
        }
      }

      // Verify all submitted sets are valid
      for (const set of sets) {
        const result = verifySidonSet(set)
        if (!result.valid) {
          return {
            verified: false,
            message: `Invalid Sidon set: [${set.join(', ')}] - ${result.error}`,
          }
        }

        // Check size and range
        if (set.length !== setSize) {
          return {
            verified: false,
            message: `Set [${set.join(', ')}] has wrong size: expected ${setSize}, got ${set.length}`,
          }
        }

        if (set.some(n => n > maxElement)) {
          return {
            verified: false,
            message: `Set [${set.join(', ')}] contains elements > ${maxElement}`,
          }
        }
      }

      // Find all actual Sidon sets and compare count
      const actualSets = findAllSidonSets(maxElement, setSize)

      if (sets.length !== actualSets.length) {
        return {
          verified: false,
          message: `Found ${sets.length} sets, expected ${actualSets.length}`,
        }
      }

      return {
        verified: true,
        message: `Correct! Found all ${sets.length} Sidon sets of size ${setSize} in [1, ${maxElement}]`,
      }
    }

    if (computeType === 'count') {
      const maxElement = (parameters.max_element ?? parameters.maxElement) as number
      const setSize = (parameters.set_size ?? parameters.setSize) as number
      const count = answer.count as number

      if (typeof count !== 'number') {
        return {
          verified: false,
          message: 'Answer must contain count (number)',
        }
      }

      const actualCount = countSidonSets(maxElement, setSize)

      if (count !== actualCount) {
        return {
          verified: false,
          message: `Incorrect count: got ${count}, expected ${actualCount}`,
        }
      }

      return {
        verified: true,
        message: `Correct! There are ${count} Sidon sets of size ${setSize} in [1, ${maxElement}]`,
      }
    }

    if (computeType === 'find_maximum') {
      const maxElement = (parameters.max_element ?? parameters.maxElement) as number
      const set = answer.set as number[]

      if (!Array.isArray(set)) {
        return {
          verified: false,
          message: 'Answer must contain set array',
        }
      }

      // Verify it's a valid Sidon set
      const result = verifySidonSet(set)
      if (!result.valid) {
        return {
          verified: false,
          message: `Invalid Sidon set: ${result.error}`,
        }
      }

      // Check range
      if (set.some(n => n > maxElement || n < 1)) {
        return {
          verified: false,
          message: `Set contains elements outside [1, ${maxElement}]`,
        }
      }

      // Find actual maximum
      const actualMax = findMaxSidonSet(maxElement)

      if (set.length < actualMax.length) {
        return {
          verified: false,
          message: `Found set of size ${set.length}, but maximum is ${actualMax.length}`,
        }
      }

      return {
        verified: true,
        message: `Correct! Found maximum Sidon set of size ${set.length} in [1, ${maxElement}]`,
      }
    }

    return {
      verified: false,
      message: `Unknown compute type: ${computeType}`,
    }
  }

  if (taskType === 'VERIFY') {
    const set = parameters.set as number[]
    const isSidon = (answer.isSidon ?? answer.is_sidon) as boolean

    if (typeof isSidon !== 'boolean') {
      return {
        verified: false,
        message: 'Answer must contain isSidon (boolean)',
      }
    }

    const result = verifySidonSet(set)
    const actualIsSidon = result.valid

    if (isSidon !== actualIsSidon) {
      return {
        verified: false,
        message: `Incorrect: set is ${actualIsSidon ? '' : 'not '}a Sidon set`,
      }
    }

    return {
      verified: true,
      message: `Correct! Set [${set.join(', ')}] is ${isSidon ? '' : 'not '}a Sidon set`,
    }
  }

  return {
    verified: false,
    message: `Unsupported task type for Sidon: ${taskType}`,
  }
}

// Helper function to check if a number is prime
function isPrime(n: number): boolean {
  if (n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false

  const sqrt = Math.sqrt(n)
  for (let i = 3; i <= sqrt; i += 2) {
    if (n % i === 0) return false
  }

  return true
}

// Re-export individual verifiers for direct use
export { verifyErdosStraus, findErdosStrausSolution } from './erdos-straus'
export {
  verifyCollatzStoppingTime,
  verifyCollatzMaxValue,
  verifyCollatzSequence,
  verifyCollatzRange,
  computeCollatzSequence,
  computeStoppingTime,
  computeMaxValue,
} from './collatz'
export { verifySidonSet, findAllSidonSets, countSidonSets, findMaxSidonSet } from './sidon'
