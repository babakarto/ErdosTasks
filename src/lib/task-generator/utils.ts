/**
 * Task Generator Utility Functions
 *
 * Math utilities for generating task parameters.
 * Uses BigInt where necessary to avoid JavaScript number overflow.
 */

/**
 * Check if a number is prime using trial division for small numbers
 * and Miller-Rabin for large numbers.
 */
export function isPrime(n: number | bigint): boolean {
  const num = BigInt(n);

  if (num < 2n) return false;
  if (num === 2n) return true;
  if (num === 3n) return true;
  if (num % 2n === 0n) return false;
  if (num % 3n === 0n) return false;

  // For small numbers, use trial division
  if (num < 1000000n) {
    let i = 5n;
    while (i * i <= num) {
      if (num % i === 0n || num % (i + 2n) === 0n) return false;
      i += 6n;
    }
    return true;
  }

  // For larger numbers, use Miller-Rabin
  return millerRabinTest(num);
}

/**
 * Miller-Rabin primality test for large numbers.
 * Uses deterministic witnesses for numbers up to 3,317,044,064,679,887,385,961,981.
 */
function millerRabinTest(n: bigint): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  // Write n-1 as 2^r * d
  let r = 0n;
  let d = n - 1n;
  while (d % 2n === 0n) {
    d /= 2n;
    r++;
  }

  // Deterministic witnesses for different ranges
  // These witnesses are sufficient for all n < 3,317,044,064,679,887,385,961,981
  const witnesses: bigint[] = [];
  if (n < 2047n) {
    witnesses.push(2n);
  } else if (n < 1373653n) {
    witnesses.push(2n, 3n);
  } else if (n < 9080191n) {
    witnesses.push(31n, 73n);
  } else if (n < 25326001n) {
    witnesses.push(2n, 3n, 5n);
  } else if (n < 3215031751n) {
    witnesses.push(2n, 3n, 5n, 7n);
  } else if (n < 4759123141n) {
    witnesses.push(2n, 7n, 61n);
  } else if (n < 1122004669633n) {
    witnesses.push(2n, 13n, 23n, 1662803n);
  } else if (n < 2152302898747n) {
    witnesses.push(2n, 3n, 5n, 7n, 11n);
  } else if (n < 3474749660383n) {
    witnesses.push(2n, 3n, 5n, 7n, 11n, 13n);
  } else if (n < 341550071728321n) {
    witnesses.push(2n, 3n, 5n, 7n, 11n, 13n, 17n);
  } else {
    // For very large numbers, use these witnesses
    witnesses.push(2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n);
  }

  // Test each witness
  witnessLoop:
  for (const a of witnesses) {
    if (a >= n) continue;

    let x = modPow(a, d, n);

    if (x === 1n || x === n - 1n) continue;

    for (let i = 0n; i < r - 1n; i++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) continue witnessLoop;
    }

    return false;
  }

  return true;
}

/**
 * Modular exponentiation: (base^exp) mod mod
 * Uses binary exponentiation for efficiency.
 */
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;

  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp / 2n;
    base = (base * base) % mod;
  }

  return result;
}

/**
 * Get a random integer in the range [min, max] (inclusive).
 */
export function randomIntInRange(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random BigInt in the range [min, max] (inclusive).
 */
export function randomBigIntInRange(min: bigint, max: bigint): bigint {
  const range = max - min + 1n;

  // Convert range to string and get bit length
  const rangeBits = range.toString(2).length;
  const byteLength = Math.ceil(rangeBits / 8);

  // Generate random bytes and convert to BigInt
  let randomBig: bigint;
  do {
    // Use crypto if available, otherwise Math.random
    const bytes = new Uint8Array(byteLength);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < byteLength; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    randomBig = bytes.reduce((acc, byte) => (acc << 8n) | BigInt(byte), 0n);
    randomBig = randomBig % range;
  } while (randomBig >= range);

  return min + randomBig;
}

/**
 * Get a random prime in the range [min, max].
 * Uses random sampling with primality testing.
 */
export function randomPrimeInRange(min: number, max: number): number {
  const minBig = BigInt(min);
  const maxBig = BigInt(max);

  // For efficiency, try random numbers and test for primality
  // This is more efficient than generating all primes for large ranges
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get a random odd number in the range
    let candidate = randomIntInRange(min, max);

    // Ensure it's odd (except for 2)
    if (candidate > 2 && candidate % 2 === 0) {
      candidate++;
      if (candidate > max) candidate -= 2;
    }

    if (isPrime(candidate)) {
      return candidate;
    }
  }

  // Fallback: search sequentially from a random starting point
  const start = randomIntInRange(min, max);
  let candidate = start % 2 === 0 ? start + 1 : start;

  // Search forward
  while (candidate <= max) {
    if (isPrime(candidate)) return candidate;
    candidate += 2;
  }

  // Search backward
  candidate = start % 2 === 0 ? start - 1 : start - 2;
  while (candidate >= min) {
    if (isPrime(candidate)) return candidate;
    candidate -= 2;
  }

  throw new Error(`No prime found in range [${min}, ${max}]`);
}

/**
 * Get a random BigInt prime in the range [min, max].
 */
export function randomBigPrimeInRange(min: bigint, max: bigint): bigint {
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let candidate = randomBigIntInRange(min, max);

    // Ensure it's odd (except for 2)
    if (candidate > 2n && candidate % 2n === 0n) {
      candidate++;
      if (candidate > max) candidate -= 2n;
    }

    if (isPrime(candidate)) {
      return candidate;
    }
  }

  // Fallback: search sequentially from a random starting point
  const start = randomBigIntInRange(min, max);
  let candidate = start % 2n === 0n ? start + 1n : start;

  // Search forward
  while (candidate <= max) {
    if (isPrime(candidate)) return candidate;
    candidate += 2n;
  }

  // Search backward
  candidate = start % 2n === 0n ? start - 1n : start - 2n;
  while (candidate >= min) {
    if (isPrime(candidate)) return candidate;
    candidate -= 2n;
  }

  throw new Error(`No prime found in range [${min}, ${max}]`);
}

/**
 * Pick a random element from an array.
 */
export function randomChoice<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Find the next prime number greater than or equal to n.
 */
export function nextPrime(n: number | bigint): bigint {
  let candidate = BigInt(n);

  if (candidate < 2n) return 2n;
  if (candidate === 2n) return 2n;

  // Start with odd number
  if (candidate % 2n === 0n) candidate++;

  while (!isPrime(candidate)) {
    candidate += 2n;
  }

  return candidate;
}

/**
 * Find the previous prime number less than or equal to n.
 * Returns null if n < 2.
 */
export function prevPrime(n: number | bigint): bigint | null {
  let candidate = BigInt(n);

  if (candidate < 2n) return null;
  if (candidate === 2n) return 2n;

  // Start with odd number
  if (candidate % 2n === 0n) candidate--;

  while (candidate >= 2n && !isPrime(candidate)) {
    candidate -= 2n;
  }

  return candidate >= 2n ? candidate : null;
}

/**
 * Generate a list of primes in range [min, max] using sieve for small ranges.
 * For larger ranges, returns an iterator.
 */
export function* primesInRange(min: number, max: number): Generator<number> {
  if (max < 2 || min > max) return;

  const start = Math.max(2, min);

  // For 2
  if (start <= 2 && max >= 2) yield 2;

  // Start with odd numbers
  let n = start % 2 === 0 ? start + 1 : start;

  while (n <= max) {
    if (isPrime(n)) yield n;
    n += 2;
  }
}

/**
 * Count primes in range [min, max].
 */
export function countPrimesInRange(min: number, max: number): number {
  let count = 0;
  for (const _ of primesInRange(min, max)) {
    count++;
  }
  return count;
}
