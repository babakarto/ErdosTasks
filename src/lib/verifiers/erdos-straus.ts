// Erdos-Straus Conjecture Verifier
// Verifies: 4/n = 1/x + 1/y + 1/z for positive integers n >= 2, x, y, z
// Uses BigInt to avoid overflow with large denominators

export interface ErdosStrausInput {
  n: number | string
  x: number | string
  y: number | string
  z: number | string
}

export interface ErdosStrausResult {
  valid: boolean
  equation?: string
  error?: string
}

/**
 * Verifies that 4/n = 1/x + 1/y + 1/z using BigInt arithmetic.
 *
 * Mathematical transformation to avoid fractions:
 * 4/n = 1/x + 1/y + 1/z
 * Multiply both sides by nxyz:
 * 4xyz = n(yz + xz + xy)
 */
export function verifyErdosStraus(input: ErdosStrausInput): ErdosStrausResult {
  try {
    // Convert to BigInt for safe large number arithmetic
    const n = BigInt(input.n)
    const x = BigInt(input.x)
    const y = BigInt(input.y)
    const z = BigInt(input.z)

    // Validation: all values must be positive
    if (n <= 0n || x <= 0n || y <= 0n || z <= 0n) {
      return {
        valid: false,
        error: 'All values (n, x, y, z) must be positive integers',
      }
    }

    // Validation: n must be >= 2
    if (n < 2n) {
      return {
        valid: false,
        error: 'n must be at least 2',
      }
    }

    // Check the equation: 4xyz = n(yz + xz + xy)
    // Left side: 4 * x * y * z
    const leftSide = 4n * x * y * z

    // Right side: n * (y*z + x*z + x*y)
    const rightSide = n * (y * z + x * z + x * y)

    const valid = leftSide === rightSide

    if (valid) {
      return {
        valid: true,
        equation: `4/${n} = 1/${x} + 1/${y} + 1/${z}`,
      }
    } else {
      return {
        valid: false,
        error: `Invalid: 4/${n} ≠ 1/${x} + 1/${y} + 1/${z}`,
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: `Invalid input: ${error instanceof Error ? error.message : 'unknown error'}`,
    }
  }
}

/**
 * Find a valid Egyptian fraction representation for n.
 * Uses a systematic search approach.
 * Returns null if no solution found within limits.
 *
 * For 4/n = 1/x + 1/y + 1/z where x <= y <= z:
 * - x must be at least ceil(n/4) since 1/x <= 4/n means x >= n/4
 * - x must be at most n since 1/x >= 1/n (we need 1/x to be significant)
 */
export function findErdosStrausSolution(n: number | string): ErdosStrausInput | null {
  const nBig = BigInt(n)

  if (nBig < 2n) {
    return null
  }

  // For 4/n = 1/x + 1/y + 1/z where x <= y <= z
  // We need x >= n/4 (ceiling) and x <= n
  const minX = (nBig + 3n) / 4n // ceiling division: ceil(n/4)
  const maxX = nBig

  for (let x = minX; x <= maxX; x++) {
    // After choosing x, we need: 4/n - 1/x = 1/y + 1/z
    // (4x - n)/(nx) = 1/y + 1/z

    const num = 4n * x - nBig // numerator of remaining fraction
    if (num <= 0n) continue

    const den = nBig * x // denominator of remaining fraction

    // For 1/y + 1/z = num/den where y <= z:
    // y >= den/num * 1/2 (approximately) and y <= 2*den/num
    // More precisely: y >= ceil(den/num) and 1/z = num/den - 1/y must be positive

    const minY = x // y >= x for canonical ordering
    // y must satisfy: num/den - 1/y > 0, i.e., y > den/num
    // Also, 1/y <= num/den means y >= den/num
    const yLowerBound = (den + num - 1n) / num // ceil(den/num)
    const actualMinY = minY > yLowerBound ? minY : yLowerBound

    // y <= 2*den/num since 1/y >= (num/den)/2
    const maxY = 2n * den / num + 1n

    for (let y = actualMinY; y <= maxY; y++) {
      // Solve for z: 1/z = num/den - 1/y = (num*y - den)/(den*y)
      // z = (den*y)/(num*y - den)

      const zNum = den * y
      const zDen = num * y - den

      if (zDen <= 0n) continue

      if (zNum % zDen === 0n) {
        const z = zNum / zDen
        if (z >= y) {
          // Verify the solution
          const result = verifyErdosStraus({
            n: n.toString(),
            x: x.toString(),
            y: y.toString(),
            z: z.toString(),
          })
          if (result.valid) {
            return {
              n: n.toString(),
              x: x.toString(),
              y: y.toString(),
              z: z.toString(),
            }
          }
        }
      }
    }
  }

  return null
}
