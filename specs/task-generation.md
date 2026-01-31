# Task Generation Specification

## Overview
Automatic generation of mathematical tasks to keep a steady supply available.
Tasks are generated on-demand or via scheduled cron job.

## Location
`src/lib/task-generator.ts`

---

## Erdős-Straus Task Generator

### COMPUTE Tasks

```typescript
interface ErdosStrausComputeTask {
    problem: 'erdos-straus';
    type: 'COMPUTE';
    title: string;
    description: string;
    parameters: { n: number };
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    verification_type: 'automatic';
}

function generateErdosStrausCompute(): ErdosStrausComputeTask {
    // Pick random range based on desired difficulty
    const difficulties = [
        { range: [100, 10000], difficulty: 'easy', points: 5 },
        { range: [10000, 1000000], difficulty: 'medium', points: 10 },
        { range: [1000000, 1000000000], difficulty: 'hard', points: 20 }
    ];
    
    const { range, difficulty, points } = randomChoice(difficulties);
    
    // Pick a random prime in range
    const n = randomPrimeInRange(range[0], range[1]);
    
    return {
        problem: 'erdos-straus',
        type: 'COMPUTE',
        title: `Find Egyptian fraction for n=${n}`,
        description: `Find positive integers x, y, z such that 4/${n} = 1/x + 1/y + 1/z`,
        parameters: { n },
        difficulty,
        points,
        verification_type: 'automatic'
    };
}
```

### VERIFY Tasks

```typescript
function generateErdosStrausVerify(): Task {
    const rangeSize = randomChoice([100, 500, 1000]);
    const start = randomPrimeInRange(1e6, 1e10);
    
    return {
        problem: 'erdos-straus',
        type: 'VERIFY',
        title: `Verify all primes in [${start}, ${start + rangeSize}] have solutions`,
        description: `Check that every prime n in the range has integers x, y, z with 4/n = 1/x + 1/y + 1/z`,
        parameters: { range_start: start, range_end: start + rangeSize },
        difficulty: 'medium',
        points: 15,
        verification_type: 'automatic'
    };
}
```

### SEARCH Tasks

```typescript
function generateErdosStrausSearch(): Task {
    // Pick a challenging range beyond current verification frontier
    const start = 1e17 + Math.floor(Math.random() * 1e6);
    const size = 1e5;
    
    return {
        problem: 'erdos-straus',
        type: 'SEARCH',
        title: `Search for counterexample in [${start}, ${start + size}]`,
        description: `Find any n in the range where 4/n cannot be written as sum of 3 unit fractions`,
        parameters: { range_start: start, range_end: start + size },
        difficulty: 'hard',
        points: 50,
        verification_type: 'automatic'
    };
}
```

---

## Collatz Task Generator

### COMPUTE Tasks

```typescript
// Stopping time task
function generateCollatzStoppingTime(): Task {
    const difficulties = [
        { range: [1000, 10000], difficulty: 'easy', points: 5 },
        { range: [10000, 1000000], difficulty: 'medium', points: 10 },
        { range: [1000000, 1000000000], difficulty: 'hard', points: 15 }
    ];
    
    const { range, difficulty, points } = randomChoice(difficulties);
    const n = randomIntInRange(range[0], range[1]);
    
    return {
        problem: 'collatz',
        type: 'COMPUTE',
        title: `Calculate stopping time for n=${n}`,
        description: `Find how many steps it takes for the Collatz sequence starting at ${n} to reach 1`,
        parameters: { n, metric: 'stopping_time' },
        difficulty,
        points,
        verification_type: 'automatic'
    };
}

// Max value task
function generateCollatzMaxValue(): Task {
    const n = randomIntInRange(1000, 1000000);
    
    return {
        problem: 'collatz',
        type: 'COMPUTE',
        title: `Find maximum value in sequence for n=${n}`,
        description: `Find the largest number reached in the Collatz sequence starting from ${n}`,
        parameters: { n, metric: 'max_value' },
        difficulty: 'medium',
        points: 10,
        verification_type: 'automatic'
    };
}
```

### VERIFY Tasks

```typescript
function generateCollatzVerify(): Task {
    const start = randomIntInRange(1e8, 1e10);
    const size = 1000;
    
    return {
        problem: 'collatz',
        type: 'VERIFY',
        title: `Verify Collatz for range [${start}, ${start + size}]`,
        description: `Confirm that every number in the range eventually reaches 1`,
        parameters: { range_start: start, range_end: start + size },
        difficulty: 'medium',
        points: 15,
        verification_type: 'automatic'
    };
}
```

### PATTERN Tasks

```typescript
function generateCollatzPattern(): Task {
    const patterns = [
        {
            title: 'Analyze stopping times for n ≡ 1 (mod 3)',
            description: 'Find patterns in stopping times for numbers that are 1 mod 3',
            parameters: { modulus: 3, residue: 1, range: [1, 1000] }
        },
        {
            title: 'Binary representation correlation',
            description: 'Find correlation between number of 1-bits and stopping time',
            parameters: { analysis: 'binary_correlation', range: [1, 10000] }
        },
        {
            title: 'High stopping time outliers',
            description: 'Find numbers under 1M with stopping time > 400',
            parameters: { threshold: 400, max_n: 1000000 }
        }
    ];
    
    const pattern = randomChoice(patterns);
    
    return {
        problem: 'collatz',
        type: 'PATTERN',
        ...pattern,
        difficulty: 'medium',
        points: 25,
        verification_type: 'community'
    };
}
```

---

## Sidon Set Task Generator

```typescript
function generateSidonCompute(): Task {
    const tasks = [
        {
            title: 'Find all Sidon sets of size 4 within [1, 20]',
            parameters: { max_element: 20, set_size: 4 }
        },
        {
            title: 'Find all Sidon sets of size 5 within [1, 30]',
            parameters: { max_element: 30, set_size: 5 }
        },
        {
            title: 'Verify {1,2,4,8,13} is a Sidon set',
            parameters: { set: [1, 2, 4, 8, 13] }
        }
    ];
    
    const task = randomChoice(tasks);
    
    return {
        problem: 'sidon',
        type: 'COMPUTE',
        ...task,
        difficulty: 'medium',
        points: 15,
        verification_type: 'automatic'
    };
}
```

---

## Task Generation API

### Endpoint
`POST /api/v1/tasks/generate` (internal or admin only)

### Request
```json
{
    "problem": "erdos-straus",  // optional, random if not specified
    "type": "COMPUTE",          // optional
    "count": 5                  // how many to generate
}
```

### Response
```json
{
    "generated": 5,
    "tasks": [...]
}
```

---

## Scheduling

### Cron Job
Run task generation to maintain minimum open tasks:

```typescript
// cron.ts or Supabase Edge Function
async function maintainTaskPool() {
    const MIN_OPEN_TASKS = 20;
    
    const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('status', 'open');
    
    if (count < MIN_OPEN_TASKS) {
        const toGenerate = MIN_OPEN_TASKS - count;
        await generateTasks(toGenerate);
    }
}

// Run every hour
```

---

## Utility Functions

```typescript
// Helper functions needed
function randomPrimeInRange(min: number, max: number): number;
function randomIntInRange(min: number, max: number): number;
function randomChoice<T>(array: T[]): T;
function isPrime(n: number): boolean;
function nextPrime(n: number): number;
```

## Acceptance Criteria
- [ ] Generates valid tasks for all three problems
- [ ] Difficulty distribution is balanced
- [ ] Points scale appropriately with difficulty
- [ ] No duplicate tasks generated (check parameters)
- [ ] Task pool maintained at minimum level
- [ ] Random primes are actually prime
