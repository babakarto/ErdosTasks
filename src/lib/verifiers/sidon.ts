// Sidon Set Verifier
// A Sidon set (B2 sequence) is a set where all pairwise sums are distinct
// For a set S, all sums a+b (where a,b in S, a <= b) must be unique

export interface SidonResult {
  valid: boolean
  error?: string
  pairwiseSums?: number[]
}

/**
 * Verify that a set is a valid Sidon set.
 * All pairwise sums (including a+a) must be distinct.
 */
export function verifySidonSet(set: number[]): SidonResult {
  // Validation: need at least 2 elements
  if (set.length < 2) {
    return {
      valid: false,
      error: 'Set must have at least 2 elements',
    }
  }

  // Validation: no duplicate elements
  const uniqueElements = new Set(set)
  if (uniqueElements.size !== set.length) {
    return {
      valid: false,
      error: 'Set contains duplicate elements',
    }
  }

  // Validation: all elements must be positive
  if (set.some(n => n <= 0)) {
    return {
      valid: false,
      error: 'All elements must be positive integers',
    }
  }

  // Sort the set for consistent processing
  const sortedSet = [...set].sort((a, b) => a - b)

  // Compute all pairwise sums and check for duplicates
  const sums = new Set<number>()
  const allSums: number[] = []

  for (let i = 0; i < sortedSet.length; i++) {
    for (let j = i; j < sortedSet.length; j++) {
      const sum = sortedSet[i] + sortedSet[j]

      if (sums.has(sum)) {
        return {
          valid: false,
          error: `Duplicate pairwise sum ${sum} found`,
        }
      }

      sums.add(sum)
      allSums.push(sum)
    }
  }

  return {
    valid: true,
    pairwiseSums: allSums.sort((a, b) => a - b),
  }
}

/**
 * Find all Sidon sets of a given size with elements up to maxElement.
 * Uses backtracking to exhaustively search.
 */
export function findAllSidonSets(maxElement: number, setSize: number): number[][] {
  const results: number[][] = []

  if (setSize < 1 || maxElement < 1) {
    return results
  }

  function backtrack(currentSet: number[], usedSums: Set<number>, start: number): void {
    if (currentSet.length === setSize) {
      results.push([...currentSet])
      return
    }

    for (let num = start; num <= maxElement; num++) {
      // Check if adding this number would create duplicate sums
      let valid = true
      const newSums: number[] = []

      for (const existing of currentSet) {
        const sum = existing + num
        if (usedSums.has(sum)) {
          valid = false
          break
        }
        newSums.push(sum)
      }

      // Also check num + num
      const doubleSum = num + num
      if (valid && usedSums.has(doubleSum)) {
        valid = false
      }

      if (valid) {
        // Add num and its sums
        currentSet.push(num)
        for (const sum of newSums) {
          usedSums.add(sum)
        }
        usedSums.add(doubleSum)

        backtrack(currentSet, usedSums, num + 1)

        // Backtrack
        currentSet.pop()
        for (const sum of newSums) {
          usedSums.delete(sum)
        }
        usedSums.delete(doubleSum)
      }
    }
  }

  backtrack([], new Set(), 1)
  return results
}

/**
 * Count the number of Sidon sets of a given size with elements up to maxElement.
 */
export function countSidonSets(maxElement: number, setSize: number): number {
  return findAllSidonSets(maxElement, setSize).length
}

/**
 * Find the maximum Sidon set within a range [1, maxElement].
 */
export function findMaxSidonSet(maxElement: number): number[] {
  let bestSet: number[] = []

  function backtrack(currentSet: number[], usedSums: Set<number>, start: number): void {
    if (currentSet.length > bestSet.length) {
      bestSet = [...currentSet]
    }

    for (let num = start; num <= maxElement; num++) {
      // Check if adding this number would create duplicate sums
      let valid = true
      const newSums: number[] = []

      for (const existing of currentSet) {
        const sum = existing + num
        if (usedSums.has(sum)) {
          valid = false
          break
        }
        newSums.push(sum)
      }

      const doubleSum = num + num
      if (valid && usedSums.has(doubleSum)) {
        valid = false
      }

      if (valid) {
        currentSet.push(num)
        for (const sum of newSums) {
          usedSums.add(sum)
        }
        usedSums.add(doubleSum)

        backtrack(currentSet, usedSums, num + 1)

        currentSet.pop()
        for (const sum of newSums) {
          usedSums.delete(sum)
        }
        usedSums.delete(doubleSum)
      }
    }
  }

  backtrack([], new Set(), 1)
  return bestSet
}
