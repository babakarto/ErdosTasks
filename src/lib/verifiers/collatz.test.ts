import { describe, it, expect } from 'vitest'
import {
  computeCollatzSequence,
  computeStoppingTime,
  computeMaxValue,
  verifyCollatzStoppingTime,
  verifyCollatzMaxValue,
  verifyCollatzSequence,
  verifyCollatzRange,
} from './collatz'

describe('computeCollatzSequence', () => {
  it('computes sequence for n=1', () => {
    const seq = computeCollatzSequence(1)
    expect(seq).toEqual([1n])
  })

  it('computes sequence for n=7', () => {
    const seq = computeCollatzSequence(7)
    expect(seq).toEqual([7n, 22n, 11n, 34n, 17n, 52n, 26n, 13n, 40n, 20n, 10n, 5n, 16n, 8n, 4n, 2n, 1n])
  })

  it('computes sequence for n=27', () => {
    const seq = computeCollatzSequence(27)
    expect(seq).not.toBeNull()
    expect(seq![0]).toBe(27n)
    expect(seq![seq!.length - 1]).toBe(1n)
    expect(seq!.length).toBe(112) // 111 steps + initial value
  })

  it('returns null for n <= 0', () => {
    expect(computeCollatzSequence(0)).toBeNull()
    expect(computeCollatzSequence(-1)).toBeNull()
  })
})

describe('computeStoppingTime', () => {
  it('returns 0 for n=1', () => {
    expect(computeStoppingTime(1)).toBe(0)
  })

  it('returns 111 for n=27', () => {
    expect(computeStoppingTime(27)).toBe(111)
  })

  it('returns 16 for n=7', () => {
    expect(computeStoppingTime(7)).toBe(16)
  })

  it('returns null for n <= 0', () => {
    expect(computeStoppingTime(0)).toBeNull()
    expect(computeStoppingTime(-5)).toBeNull()
  })
})

describe('computeMaxValue', () => {
  it('returns n for n=1', () => {
    expect(computeMaxValue(1)).toBe(1n)
  })

  it('returns 9232 for n=27', () => {
    expect(computeMaxValue(27)).toBe(9232n)
  })

  it('returns 52 for n=7', () => {
    expect(computeMaxValue(7)).toBe(52n)
  })

  it('handles large numbers', () => {
    // n = 1000000: the max value might be >= n depending on the sequence
    // For 1000000, the sequence starts: 1000000 -> 500000 -> ... (halving)
    // Since 1000000 is even, it goes down. Let's use n=837799 which has high max
    const max = computeMaxValue(837799)
    expect(max).not.toBeNull()
    // 837799 is known to have a very high peak
    expect(max!).toBeGreaterThan(837799n)
  })
})

describe('verifyCollatzStoppingTime', () => {
  it('validates correct stopping time for n=27', () => {
    const result = verifyCollatzStoppingTime(27, 111)
    expect(result.valid).toBe(true)
    expect(result.computed?.stoppingTime).toBe(111)
  })

  it('rejects incorrect stopping time', () => {
    const result = verifyCollatzStoppingTime(27, 100)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('expected 111')
  })

  it('handles string input', () => {
    const result = verifyCollatzStoppingTime('27', 111)
    expect(result.valid).toBe(true)
  })

  it('rejects non-positive input', () => {
    const result = verifyCollatzStoppingTime(0, 0)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('n must be a positive integer')
  })
})

describe('verifyCollatzMaxValue', () => {
  it('validates correct max value for n=27', () => {
    const result = verifyCollatzMaxValue(27, 9232)
    expect(result.valid).toBe(true)
    expect(result.computed?.maxValue).toBe('9232')
  })

  it('rejects incorrect max value', () => {
    const result = verifyCollatzMaxValue(27, 9000)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('expected 9232')
  })

  it('handles BigInt string input', () => {
    const result = verifyCollatzMaxValue('27', '9232')
    expect(result.valid).toBe(true)
  })
})

describe('verifyCollatzSequence', () => {
  it('validates correct sequence for n=7', () => {
    const seq = [7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]
    const result = verifyCollatzSequence(7, seq)
    expect(result.valid).toBe(true)
  })

  it('rejects incorrect sequence', () => {
    const seq = [7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 2] // Wrong ending
    const result = verifyCollatzSequence(7, seq)
    expect(result.valid).toBe(false)
  })

  it('rejects sequence with wrong length', () => {
    const seq = [7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2] // Missing final 1
    const result = verifyCollatzSequence(7, seq)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('length mismatch')
  })
})

describe('verifyCollatzRange', () => {
  it('validates that range [1, 100] all reach 1', () => {
    const result = verifyCollatzRange(1, 100, true)
    expect(result.valid).toBe(true)
  })

  it('validates that range [1000000, 1000010] all reach 1', () => {
    const result = verifyCollatzRange(1000000, 1000010, true)
    expect(result.valid).toBe(true)
  })

  it('rejects incorrect claim', () => {
    const result = verifyCollatzRange(1, 100, false)
    expect(result.valid).toBe(false)
  })

  it('rejects invalid range', () => {
    const result = verifyCollatzRange(100, 1, true)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Range start must be less than or equal to range end')
  })

  it('rejects non-positive range values', () => {
    const result = verifyCollatzRange(0, 10, true)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Range values must be positive integers')
  })
})
