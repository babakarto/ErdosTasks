import { describe, it, expect } from 'vitest'
import {
  verifySidonSet,
  findAllSidonSets,
  countSidonSets,
  findMaxSidonSet,
} from './sidon'

describe('verifySidonSet', () => {
  it('validates {1, 2, 4, 8, 13} as a valid Sidon set', () => {
    // This is a known Sidon set mentioned in the specs
    const result = verifySidonSet([1, 2, 4, 8, 13])
    expect(result.valid).toBe(true)
    expect(result.pairwiseSums).toBeDefined()
  })

  it('validates {1, 2, 5, 10} as a valid Sidon set', () => {
    const result = verifySidonSet([1, 2, 5, 10])
    expect(result.valid).toBe(true)
  })

  it('validates {1, 2, 5, 11, 19} as a valid Sidon set', () => {
    const result = verifySidonSet([1, 2, 5, 11, 19])
    expect(result.valid).toBe(true)
  })

  it('rejects {1, 2, 3, 4} as invalid (1+3 = 2+2 = 4)', () => {
    const result = verifySidonSet([1, 2, 3, 4])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Duplicate pairwise sum')
  })

  it('rejects {1, 2, 3, 5} as invalid (1+5 = 2+4, but wait 4 is not there... let me check 2+3 = 5 = 1+4 no...)', () => {
    // Actually let's verify: 1+1=2, 1+2=3, 1+3=4, 1+5=6, 2+2=4, 2+3=5, 2+5=7, 3+3=6, 3+5=8, 5+5=10
    // 1+3=4 and 2+2=4, so this IS invalid
    const result = verifySidonSet([1, 2, 3, 5])
    expect(result.valid).toBe(false)
  })

  it('rejects empty set', () => {
    const result = verifySidonSet([])
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Set must have at least 2 elements')
  })

  it('rejects single element set', () => {
    const result = verifySidonSet([5])
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Set must have at least 2 elements')
  })

  it('rejects set with duplicate elements', () => {
    const result = verifySidonSet([1, 2, 2, 4])
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Set contains duplicate elements')
  })

  it('rejects set with non-positive elements', () => {
    const result = verifySidonSet([0, 1, 2, 4])
    expect(result.valid).toBe(false)
    expect(result.error).toBe('All elements must be positive integers')

    const result2 = verifySidonSet([-1, 1, 2, 4])
    expect(result2.valid).toBe(false)
    expect(result2.error).toBe('All elements must be positive integers')
  })

  it('returns sorted pairwise sums for valid set', () => {
    const result = verifySidonSet([1, 2, 5])
    expect(result.valid).toBe(true)
    // Sums: 1+1=2, 1+2=3, 1+5=6, 2+2=4, 2+5=7, 5+5=10
    expect(result.pairwiseSums).toEqual([2, 3, 4, 6, 7, 10])
  })
})

describe('findAllSidonSets', () => {
  it('finds all size-2 Sidon sets in [1, 5]', () => {
    const sets = findAllSidonSets(5, 2)
    // All pairs are valid Sidon sets
    expect(sets.length).toBe(10) // C(5,2) = 10
    expect(sets).toContainEqual([1, 2])
    expect(sets).toContainEqual([4, 5])
  })

  it('finds all size-3 Sidon sets in [1, 6]', () => {
    const sets = findAllSidonSets(6, 3)
    expect(sets.length).toBeGreaterThan(0)

    // Verify each found set is actually a Sidon set
    for (const set of sets) {
      const result = verifySidonSet(set)
      expect(result.valid).toBe(true)
    }
  })

  it('finds all size-4 Sidon sets in [1, 20]', () => {
    const sets = findAllSidonSets(20, 4)
    expect(sets.length).toBeGreaterThan(0)

    // {1, 2, 5, 10} should be in the results
    const containsExpected = sets.some(
      s => s.length === 4 && s.includes(1) && s.includes(2) && s.includes(5) && s.includes(10)
    )
    expect(containsExpected).toBe(true)

    // Verify all are valid
    for (const set of sets) {
      expect(verifySidonSet(set).valid).toBe(true)
    }
  })

  it('returns empty for impossible parameters', () => {
    expect(findAllSidonSets(0, 2)).toEqual([])
    expect(findAllSidonSets(5, 0)).toEqual([])
  })
})

describe('countSidonSets', () => {
  it('counts size-2 Sidon sets in [1, 5]', () => {
    expect(countSidonSets(5, 2)).toBe(10)
  })

  it('counts size-3 Sidon sets in [1, 8]', () => {
    const count = countSidonSets(8, 3)
    expect(count).toBeGreaterThan(0)
  })
})

describe('findMaxSidonSet', () => {
  it('finds a maximal Sidon set in [1, 10]', () => {
    const maxSet = findMaxSidonSet(10)
    expect(maxSet.length).toBeGreaterThanOrEqual(3)
    expect(verifySidonSet(maxSet).valid).toBe(true)
  })

  it('finds a maximal Sidon set in [1, 20]', () => {
    const maxSet = findMaxSidonSet(20)
    expect(maxSet.length).toBeGreaterThanOrEqual(4)
    expect(verifySidonSet(maxSet).valid).toBe(true)
  })
})
