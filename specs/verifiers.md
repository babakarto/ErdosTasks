# Mathematical Verifiers Specification

## Overview
Automatic verification system for COMPUTE, VERIFY, and SEARCH task submissions.
Solutions are verified server-side with exact arithmetic - no floating point errors.

## Location
`src/lib/verifiers/`

---

## Erdős-Straus Verifier

### Purpose
Verify that `4/n = 1/x + 1/y + 1/z` for given positive integers.

### Implementation

```typescript
// src/lib/verifiers/erdos-straus.ts

interface ErdosStrausResult {
    valid: boolean;
    equation?: string;
    error?: string;
}

function verifyErdosStrausSolution(
    n: number,
    x: number,
    y: number,
    z: number
): ErdosStrausResult {
    // Validation: all values must be positive integers
    if ([n, x, y, z].some(v => !Number.isInteger(v) || v <= 0)) {
        return { valid: false, error: "All values must be positive integers" };
    }
    
    if (n < 2) {
        return { valid: false, error: "n must be >= 2" };
    }

    // Use BigInt for exact arithmetic to avoid overflow
    // Check: 4/n = 1/x + 1/y + 1/z
    // Equivalent: 4*x*y*z = n*(y*z + x*z + x*y)
    const bn = BigInt(n), bx = BigInt(x), by = BigInt(y), bz = BigInt(z);
    const left = 4n * bx * by * bz;
    const right = bn * (by * bz + bx * bz + bx * by);

    if (left === right) {
        return {
            valid: true,
            equation: `4/${n} = 1/${x} + 1/${y} + 1/${z}`
        };
    } else {
        return {
            valid: false,
            error: `Equation doesn't hold: 4/${n} ≠ 1/${x} + 1/${y} + 1/${z}`
        };
    }
}
```

### Test Cases
- `verifyErdosStrausSolution(5, 2, 4, 20)` → valid (4/5 = 1/2 + 1/4 + 1/20)
- `verifyErdosStrausSolution(5, 2, 5, 10)` → valid (4/5 = 1/2 + 1/5 + 1/10)
- `verifyErdosStrausSolution(5, 1, 1, 1)` → invalid
- `verifyErdosStrausSolution(1, 1, 1, 1)` → invalid (n < 2)

---

## Collatz Verifier

### Purpose
Verify Collatz sequence properties: stopping times, max values, full sequences.

### Implementation

```typescript
// src/lib/verifiers/collatz.ts

interface CollatzResult {
    valid: boolean;
    error?: string;
    computed?: {
        stoppingTime?: number;
        maxValue?: bigint;
        sequence?: bigint[];
    };
}

const MAX_STEPS = 100000;

function collatzStep(n: bigint): bigint {
    return n % 2n === 0n ? n / 2n : 3n * n + 1n;
}

function verifyCollatzStoppingTime(n: number, claimedTime: number): CollatzResult {
    if (n <= 0) {
        return { valid: false, error: "n must be positive" };
    }

    let current = BigInt(n);
    let steps = 0;

    while (current !== 1n && steps < MAX_STEPS) {
        current = collatzStep(current);
        steps++;
    }

    if (current !== 1n) {
        return { valid: false, error: "Did not reach 1 within limit" };
    }

    if (steps === claimedTime) {
        return { valid: true, computed: { stoppingTime: steps } };
    } else {
        return {
            valid: false,
            error: `Wrong stopping time: expected ${steps}, got ${claimedTime}`
        };
    }
}

function verifyCollatzMaxValue(n: number, claimedMax: string): CollatzResult {
    if (n <= 0) {
        return { valid: false, error: "n must be positive" };
    }

    let current = BigInt(n);
    let maxVal = current;
    let steps = 0;

    while (current !== 1n && steps < MAX_STEPS) {
        current = collatzStep(current);
        if (current > maxVal) maxVal = current;
        steps++;
    }

    const claimedBig = BigInt(claimedMax);
    if (maxVal === claimedBig) {
        return { valid: true, computed: { maxValue: maxVal } };
    } else {
        return {
            valid: false,
            error: `Wrong max value: expected ${maxVal}, got ${claimedMax}`
        };
    }
}

function verifyCollatzSequence(n: number, claimedSequence: number[]): CollatzResult {
    if (n <= 0) {
        return { valid: false, error: "n must be positive" };
    }

    const sequence: bigint[] = [BigInt(n)];
    let current = BigInt(n);

    while (current !== 1n && sequence.length < MAX_STEPS) {
        current = collatzStep(current);
        sequence.push(current);
    }

    // Compare sequences
    if (sequence.length !== claimedSequence.length) {
        return {
            valid: false,
            error: `Sequence length mismatch: expected ${sequence.length}, got ${claimedSequence.length}`
        };
    }

    for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] !== BigInt(claimedSequence[i])) {
            return {
                valid: false,
                error: `Mismatch at position ${i}: expected ${sequence[i]}, got ${claimedSequence[i]}`
            };
        }
    }

    return { valid: true, computed: { sequence } };
}

function verifyCollatzRange(
    rangeStart: number,
    rangeEnd: number,
    claimedAllReach1: boolean
): CollatzResult {
    for (let n = rangeStart; n <= rangeEnd; n++) {
        let current = BigInt(n);
        let steps = 0;
        
        while (current !== 1n && steps < MAX_STEPS) {
            current = collatzStep(current);
            steps++;
        }
        
        if (current !== 1n && claimedAllReach1) {
            return {
                valid: false,
                error: `${n} did not reach 1 within ${MAX_STEPS} steps`
            };
        }
    }

    return { valid: true };
}
```

### Test Cases
- `verifyCollatzStoppingTime(27, 111)` → valid
- `verifyCollatzStoppingTime(27, 100)` → invalid
- `verifyCollatzMaxValue(27, "9232")` → valid
- Sequence for n=7: [7, 22, 11, 34, 17, 52, 26, 13, 40, 20, 10, 5, 16, 8, 4, 2, 1]

---

## Sidon Set Verifier

### Purpose
Verify Sidon set properties: all pairwise sums must be distinct.

### Implementation

```typescript
// src/lib/verifiers/sidon.ts

interface SidonResult {
    valid: boolean;
    error?: string;
    pairwiseSums?: number[];
}

function verifySidonSet(set: number[]): SidonResult {
    if (set.length < 2) {
        return { valid: false, error: "Set must have at least 2 elements" };
    }

    // Check all distinct
    if (new Set(set).size !== set.length) {
        return { valid: false, error: "Set contains duplicates" };
    }

    // Check all positive
    if (set.some(x => x <= 0)) {
        return { valid: false, error: "All elements must be positive" };
    }

    const sums: number[] = [];
    const sumSet = new Set<number>();

    // Generate all pairwise sums (i < j)
    for (let i = 0; i < set.length; i++) {
        for (let j = i + 1; j < set.length; j++) {
            const sum = set[i] + set[j];
            if (sumSet.has(sum)) {
                return {
                    valid: false,
                    error: `Duplicate sum ${sum} found`
                };
            }
            sumSet.add(sum);
            sums.push(sum);
        }
    }

    return { valid: true, pairwiseSums: sums };
}

function findAllSidonSets(maxElement: number, setSize: number): number[][] {
    const results: number[][] = [];
    
    function backtrack(current: number[], start: number) {
        if (current.length === setSize) {
            if (verifySidonSet(current).valid) {
                results.push([...current]);
            }
            return;
        }
        
        for (let i = start; i <= maxElement; i++) {
            current.push(i);
            // Early pruning: check if still valid Sidon set
            if (verifySidonSet(current).valid) {
                backtrack(current, i + 1);
            }
            current.pop();
        }
    }
    
    backtrack([], 1);
    return results;
}
```

### Test Cases
- `verifySidonSet([1, 2, 4, 8, 13])` → valid
- `verifySidonSet([1, 2, 3, 4])` → invalid (1+3 = 2+2 = 4? Actually 1+4=5, 2+3=5, duplicate!)
- `verifySidonSet([1, 2, 5, 10])` → valid

---

## Task Verification Router

### Purpose
Route submissions to appropriate verifier based on problem and task type.

```typescript
// src/lib/verifiers/index.ts

import { verifyErdosStrausSolution } from './erdos-straus';
import { verifyCollatzStoppingTime, verifyCollatzMaxValue, verifyCollatzRange } from './collatz';
import { verifySidonSet } from './sidon';

interface VerificationResult {
    verified: boolean;
    message: string;
    points?: number;
}

async function verifySubmission(
    task: Task,
    answer: Record<string, any>
): Promise<VerificationResult> {
    switch (task.problem.slug) {
        case 'erdos-straus':
            return verifyErdosStrausSubmission(task, answer);
        case 'collatz':
            return verifyCollatzSubmission(task, answer);
        case 'sidon':
            return verifySidonSubmission(task, answer);
        default:
            return { verified: false, message: 'Unknown problem type' };
    }
}
```

## Acceptance Criteria
- [ ] Erdős-Straus verifier uses exact BigInt arithmetic
- [ ] Collatz verifier handles large sequences without overflow
- [ ] Sidon verifier correctly identifies duplicate sums
- [ ] All verifiers return consistent result format
- [ ] Edge cases handled (n=0, negative, non-integer)
- [ ] Unit tests for all verifier functions
