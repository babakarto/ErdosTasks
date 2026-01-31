import { describe, it, expect } from 'vitest';
import {
  isPrime,
  randomIntInRange,
  randomPrimeInRange,
  randomBigPrimeInRange,
  randomChoice,
  nextPrime,
  prevPrime,
  primesInRange,
  countPrimesInRange,
} from './utils';

describe('isPrime', () => {
  it('correctly identifies small primes', () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(3)).toBe(true);
    expect(isPrime(5)).toBe(true);
    expect(isPrime(7)).toBe(true);
    expect(isPrime(11)).toBe(true);
    expect(isPrime(13)).toBe(true);
    expect(isPrime(17)).toBe(true);
    expect(isPrime(19)).toBe(true);
    expect(isPrime(23)).toBe(true);
    expect(isPrime(29)).toBe(true);
  });

  it('correctly identifies small non-primes', () => {
    expect(isPrime(0)).toBe(false);
    expect(isPrime(1)).toBe(false);
    expect(isPrime(4)).toBe(false);
    expect(isPrime(6)).toBe(false);
    expect(isPrime(8)).toBe(false);
    expect(isPrime(9)).toBe(false);
    expect(isPrime(10)).toBe(false);
    expect(isPrime(12)).toBe(false);
    expect(isPrime(15)).toBe(false);
  });

  it('correctly identifies larger primes', () => {
    expect(isPrime(997)).toBe(true);
    expect(isPrime(7919)).toBe(true);
    expect(isPrime(104729)).toBe(true); // 10000th prime
  });

  it('correctly identifies larger non-primes', () => {
    expect(isPrime(1000)).toBe(false);
    expect(isPrime(7917)).toBe(false);
    expect(isPrime(104730)).toBe(false);
  });

  it('works with BigInt', () => {
    expect(isPrime(2n)).toBe(true);
    expect(isPrime(104729n)).toBe(true);
    expect(isPrime(104730n)).toBe(false);
  });

  it('handles very large primes with Miller-Rabin', () => {
    // Large known primes
    expect(isPrime(1000000007)).toBe(true);
    expect(isPrime(1000000009)).toBe(true);
    expect(isPrime(1000000000039n)).toBe(true);
  });

  it('handles very large non-primes with Miller-Rabin', () => {
    expect(isPrime(1000000008)).toBe(false);
    expect(isPrime(1000000000000n)).toBe(false);
  });
});

describe('randomIntInRange', () => {
  it('returns values within range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomIntInRange(10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
    }
  });

  it('handles single value range', () => {
    expect(randomIntInRange(5, 5)).toBe(5);
  });

  it('returns integers', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomIntInRange(1, 1000);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
});

describe('randomPrimeInRange', () => {
  it('returns a prime within range', () => {
    for (let i = 0; i < 20; i++) {
      const prime = randomPrimeInRange(100, 1000);
      expect(prime).toBeGreaterThanOrEqual(100);
      expect(prime).toBeLessThanOrEqual(1000);
      expect(isPrime(prime)).toBe(true);
    }
  });

  it('works with small ranges', () => {
    const prime = randomPrimeInRange(10, 20);
    expect([11, 13, 17, 19]).toContain(prime);
  });

  it('works with ranges containing few primes', () => {
    // Range [20, 22] only contains no primes
    // Range [22, 30] contains 23, 29
    const prime = randomPrimeInRange(22, 30);
    expect([23, 29]).toContain(prime);
  });

  it('throws if no prime in range', () => {
    // Range [20, 22] has no primes
    expect(() => randomPrimeInRange(20, 22)).toThrow();
  });
});

describe('randomBigPrimeInRange', () => {
  it('returns a BigInt prime within range', () => {
    const prime = randomBigPrimeInRange(1000000n, 1000100n);
    expect(prime).toBeGreaterThanOrEqual(1000000n);
    expect(prime).toBeLessThanOrEqual(1000100n);
    expect(isPrime(prime)).toBe(true);
  });

  it('works with large ranges', () => {
    const prime = randomBigPrimeInRange(10000000000n, 10000001000n);
    expect(prime).toBeGreaterThanOrEqual(10000000000n);
    expect(prime).toBeLessThanOrEqual(10000001000n);
    expect(isPrime(prime)).toBe(true);
  });
});

describe('randomChoice', () => {
  it('returns an element from the array', () => {
    const arr = [1, 2, 3, 4, 5];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(randomChoice(arr));
    }
  });

  it('works with strings', () => {
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(randomChoice(arr));
    }
  });

  it('throws on empty array', () => {
    expect(() => randomChoice([])).toThrow('Cannot pick from empty array');
  });

  it('returns the only element for single-element array', () => {
    expect(randomChoice([42])).toBe(42);
  });
});

describe('nextPrime', () => {
  it('returns the same number if prime', () => {
    expect(nextPrime(2)).toBe(2n);
    expect(nextPrime(7)).toBe(7n);
    expect(nextPrime(13)).toBe(13n);
  });

  it('returns the next prime if not prime', () => {
    expect(nextPrime(4)).toBe(5n);
    expect(nextPrime(6)).toBe(7n);
    expect(nextPrime(14)).toBe(17n);
    expect(nextPrime(15)).toBe(17n);
    expect(nextPrime(16)).toBe(17n);
  });

  it('handles edge cases', () => {
    expect(nextPrime(0)).toBe(2n);
    expect(nextPrime(1)).toBe(2n);
    expect(nextPrime(-5)).toBe(2n);
  });

  it('works with BigInt', () => {
    expect(nextPrime(1000000000n)).toBe(1000000007n);
  });
});

describe('prevPrime', () => {
  it('returns the same number if prime', () => {
    expect(prevPrime(2)).toBe(2n);
    expect(prevPrime(7)).toBe(7n);
    expect(prevPrime(13)).toBe(13n);
  });

  it('returns the previous prime if not prime', () => {
    expect(prevPrime(4)).toBe(3n);
    expect(prevPrime(6)).toBe(5n);
    expect(prevPrime(14)).toBe(13n);
    expect(prevPrime(15)).toBe(13n);
    expect(prevPrime(16)).toBe(13n);
  });

  it('returns null for values less than 2', () => {
    expect(prevPrime(0)).toBe(null);
    expect(prevPrime(1)).toBe(null);
    expect(prevPrime(-5)).toBe(null);
  });

  it('works with BigInt', () => {
    expect(prevPrime(1000000010n)).toBe(1000000009n);
  });
});

describe('primesInRange', () => {
  it('generates primes in range', () => {
    const primes = [...primesInRange(1, 20)];
    expect(primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19]);
  });

  it('handles ranges starting above 2', () => {
    const primes = [...primesInRange(10, 30)];
    expect(primes).toEqual([11, 13, 17, 19, 23, 29]);
  });

  it('returns empty for invalid range', () => {
    const primes = [...primesInRange(30, 10)];
    expect(primes).toEqual([]);
  });

  it('returns empty for range with no primes', () => {
    const primes = [...primesInRange(20, 22)];
    expect(primes).toEqual([]);
  });
});

describe('countPrimesInRange', () => {
  it('counts primes correctly', () => {
    expect(countPrimesInRange(1, 10)).toBe(4); // 2, 3, 5, 7
    expect(countPrimesInRange(1, 100)).toBe(25); // Standard result
    expect(countPrimesInRange(100, 200)).toBe(21);
  });

  it('returns 0 for invalid ranges', () => {
    expect(countPrimesInRange(30, 10)).toBe(0);
    expect(countPrimesInRange(20, 22)).toBe(0);
  });
});
