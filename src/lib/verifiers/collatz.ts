// Collatz Conjecture Verifier
// Verifies properties of Collatz sequences: n -> n/2 (even) or n -> 3n+1 (odd)
// Uses BigInt to handle sequences that grow very large before converging

export interface CollatzResult {
  valid: boolean
  error?: string
  computed?: {
    stoppingTime?: number
    maxValue?: string
    sequence?: string[]
  }
}

// Maximum steps to prevent infinite loops in case of bugs or counterexamples
const MAX_STEPS = 100000

/**
 * Compute the next value in the Collatz sequence
 */
function collatzStep(n: bigint): bigint {
  if (n % 2n === 0n) {
    return n / 2n
  } else {
    return 3n * n + 1n
  }
}

/**
 * Compute the full Collatz sequence from n to 1
 * Returns null if sequence doesn't reach 1 within MAX_STEPS
 */
export function computeCollatzSequence(n: bigint | number | string): bigint[] | null {
  let current = BigInt(n)
  const sequence: bigint[] = [current]

  if (current <= 0n) {
    return null
  }

  let steps = 0
  while (current !== 1n && steps < MAX_STEPS) {
    current = collatzStep(current)
    sequence.push(current)
    steps++
  }

  if (current !== 1n) {
    return null // Did not reach 1
  }

  return sequence
}

/**
 * Compute the stopping time (number of steps to reach 1)
 */
export function computeStoppingTime(n: bigint | number | string): number | null {
  let current = BigInt(n)

  if (current <= 0n) {
    return null
  }

  let steps = 0
  while (current !== 1n && steps < MAX_STEPS) {
    current = collatzStep(current)
    steps++
  }

  if (current !== 1n) {
    return null
  }

  return steps
}

/**
 * Compute the maximum value reached in the Collatz sequence
 */
export function computeMaxValue(n: bigint | number | string): bigint | null {
  let current = BigInt(n)

  if (current <= 0n) {
    return null
  }

  let maxValue = current
  let steps = 0

  while (current !== 1n && steps < MAX_STEPS) {
    current = collatzStep(current)
    if (current > maxValue) {
      maxValue = current
    }
    steps++
  }

  if (current !== 1n) {
    return null
  }

  return maxValue
}

/**
 * Verify that a claimed stopping time is correct
 */
export function verifyCollatzStoppingTime(
  n: number | string,
  claimedTime: number
): CollatzResult {
  try {
    const nBig = BigInt(n)

    if (nBig <= 0n) {
      return {
        valid: false,
        error: 'n must be a positive integer',
      }
    }

    const actualTime = computeStoppingTime(nBig)

    if (actualTime === null) {
      return {
        valid: false,
        error: `Could not verify: sequence did not reach 1 within ${MAX_STEPS} steps`,
      }
    }

    const valid = actualTime === claimedTime

    return {
      valid,
      computed: { stoppingTime: actualTime },
      error: valid ? undefined : `Incorrect stopping time: expected ${actualTime}, got ${claimedTime}`,
    }
  } catch (error) {
    return {
      valid: false,
      error: `Invalid input: ${error instanceof Error ? error.message : 'unknown error'}`,
    }
  }
}

/**
 * Verify that a claimed maximum value is correct
 */
export function verifyCollatzMaxValue(
  n: number | string,
  claimedMax: number | string
): CollatzResult {
  try {
    const nBig = BigInt(n)
    const claimedMaxBig = BigInt(claimedMax)

    if (nBig <= 0n) {
      return {
        valid: false,
        error: 'n must be a positive integer',
      }
    }

    const actualMax = computeMaxValue(nBig)

    if (actualMax === null) {
      return {
        valid: false,
        error: `Could not verify: sequence did not reach 1 within ${MAX_STEPS} steps`,
      }
    }

    const valid = actualMax === claimedMaxBig

    return {
      valid,
      computed: { maxValue: actualMax.toString() },
      error: valid ? undefined : `Incorrect max value: expected ${actualMax}, got ${claimedMax}`,
    }
  } catch (error) {
    return {
      valid: false,
      error: `Invalid input: ${error instanceof Error ? error.message : 'unknown error'}`,
    }
  }
}

/**
 * Verify that a claimed sequence is the correct Collatz sequence
 */
export function verifyCollatzSequence(
  n: number | string,
  claimedSequence: (number | string)[]
): CollatzResult {
  try {
    const nBig = BigInt(n)

    if (nBig <= 0n) {
      return {
        valid: false,
        error: 'n must be a positive integer',
      }
    }

    const actualSequence = computeCollatzSequence(nBig)

    if (actualSequence === null) {
      return {
        valid: false,
        error: `Could not verify: sequence did not reach 1 within ${MAX_STEPS} steps`,
      }
    }

    // Compare sequences
    if (actualSequence.length !== claimedSequence.length) {
      return {
        valid: false,
        computed: { sequence: actualSequence.map(v => v.toString()) },
        error: `Sequence length mismatch: expected ${actualSequence.length}, got ${claimedSequence.length}`,
      }
    }

    for (let i = 0; i < actualSequence.length; i++) {
      if (actualSequence[i] !== BigInt(claimedSequence[i])) {
        return {
          valid: false,
          computed: { sequence: actualSequence.map(v => v.toString()) },
          error: `Sequence mismatch at position ${i}: expected ${actualSequence[i]}, got ${claimedSequence[i]}`,
        }
      }
    }

    return {
      valid: true,
      computed: { sequence: actualSequence.map(v => v.toString()) },
    }
  } catch (error) {
    return {
      valid: false,
      error: `Invalid input: ${error instanceof Error ? error.message : 'unknown error'}`,
    }
  }
}

/**
 * Verify that all numbers in a range reach 1
 */
export function verifyCollatzRange(
  rangeStart: number | string,
  rangeEnd: number | string,
  claimedAllReach1: boolean
): CollatzResult {
  try {
    const start = BigInt(rangeStart)
    const end = BigInt(rangeEnd)

    if (start <= 0n || end <= 0n) {
      return {
        valid: false,
        error: 'Range values must be positive integers',
      }
    }

    if (start > end) {
      return {
        valid: false,
        error: 'Range start must be less than or equal to range end',
      }
    }

    // Check each number in range
    let allReach1 = true
    for (let n = start; n <= end; n++) {
      const time = computeStoppingTime(n)
      if (time === null) {
        allReach1 = false
        break
      }
    }

    const valid = allReach1 === claimedAllReach1

    return {
      valid,
      error: valid ? undefined : `Incorrect claim: allReach1 should be ${allReach1}`,
    }
  } catch (error) {
    return {
      valid: false,
      error: `Invalid input: ${error instanceof Error ? error.message : 'unknown error'}`,
    }
  }
}
