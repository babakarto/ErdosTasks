/**
 * Database seed script
 * Inserts initial problems and sample tasks for the Erdos Problems platform
 *
 * Run with: npm run db:seed
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Problem definitions
const problems = [
  {
    slug: 'erdos-straus',
    name: 'Erdos-Straus Conjecture',
    description:
      'The Erdos-Straus conjecture states that for every integer n >= 2, there exist positive integers x, y, z such that 4/n = 1/x + 1/y + 1/z. The conjecture has been verified for all n up to 10^17 but remains unproven.',
    formula: '4/n = 1/x + 1/y + 1/z',
    year_proposed: 1948,
    status: 'open' as const,
    verified_to: 'n < 10^17',
  },
  {
    slug: 'collatz',
    name: 'Collatz Conjecture',
    description:
      'The Collatz conjecture states that for any positive integer n, the sequence defined by n -> n/2 (if n is even) or n -> 3n+1 (if n is odd) will eventually reach 1. Also known as the 3n+1 problem or the Syracuse problem.',
    formula: 'n -> n/2 (even) or n -> 3n+1 (odd)',
    year_proposed: 1937,
    status: 'open' as const,
    verified_to: 'n < 2^68',
  },
  {
    slug: 'sidon',
    name: 'Sidon Sets',
    description:
      'A Sidon set (or B2 sequence) is a set of integers where all pairwise sums are distinct. Tasks involve finding, verifying, and enumerating Sidon sets with specific properties.',
    formula: 'For all a,b,c,d in S: a+b = c+d implies {a,b} = {c,d}',
    year_proposed: 1932,
    status: 'open' as const,
    verified_to: null,
  },
]

// Task definitions - will be linked to problems after insert
interface TaskDef {
  problem_slug: string
  type: 'COMPUTE' | 'VERIFY' | 'SEARCH' | 'PATTERN' | 'EXTEND'
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  points: number
  parameters: Record<string, unknown>
  verification_type: 'automatic' | 'community' | 'human'
}

const tasks: TaskDef[] = [
  // Erdos-Straus tasks
  {
    problem_slug: 'erdos-straus',
    type: 'COMPUTE',
    title: 'Find decomposition for n=5',
    description:
      'Find positive integers x, y, z such that 4/5 = 1/x + 1/y + 1/z. Return the three denominators.',
    difficulty: 'easy',
    points: 5,
    parameters: { n: 5 },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'erdos-straus',
    type: 'COMPUTE',
    title: 'Find decomposition for n=7',
    description:
      'Find positive integers x, y, z such that 4/7 = 1/x + 1/y + 1/z. Return the three denominators.',
    difficulty: 'easy',
    points: 5,
    parameters: { n: 7 },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'erdos-straus',
    type: 'COMPUTE',
    title: 'Find decomposition for n=1009',
    description:
      'Find positive integers x, y, z such that 4/1009 = 1/x + 1/y + 1/z. This is a medium difficulty prime.',
    difficulty: 'medium',
    points: 10,
    parameters: { n: 1009 },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'erdos-straus',
    type: 'COMPUTE',
    title: 'Find decomposition for n=10007',
    description:
      'Find positive integers x, y, z such that 4/10007 = 1/x + 1/y + 1/z. This is a harder prime.',
    difficulty: 'medium',
    points: 15,
    parameters: { n: 10007 },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'erdos-straus',
    type: 'VERIFY',
    title: 'Verify primes 100-200',
    description:
      'Verify that all prime numbers between 100 and 200 have valid Egyptian fraction decompositions.',
    difficulty: 'medium',
    points: 15,
    parameters: { range_start: 100, range_end: 200 },
    verification_type: 'automatic',
  },

  // Collatz tasks
  {
    problem_slug: 'collatz',
    type: 'COMPUTE',
    title: 'Compute stopping time for n=27',
    description:
      'Calculate the stopping time (number of steps to reach 1) for the Collatz sequence starting at n=27. This is a famous example with an unusually long sequence.',
    difficulty: 'easy',
    points: 5,
    parameters: { n: 27, compute_type: 'stopping_time' },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'collatz',
    type: 'COMPUTE',
    title: 'Find maximum value for n=27',
    description:
      'Find the maximum value reached in the Collatz sequence starting at n=27.',
    difficulty: 'easy',
    points: 5,
    parameters: { n: 27, compute_type: 'max_value' },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'collatz',
    type: 'COMPUTE',
    title: 'Compute stopping time for n=97',
    description:
      'Calculate the stopping time for the Collatz sequence starting at n=97.',
    difficulty: 'easy',
    points: 5,
    parameters: { n: 97, compute_type: 'stopping_time' },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'collatz',
    type: 'COMPUTE',
    title: 'Compute stopping time for n=871',
    description:
      'Calculate the stopping time for the Collatz sequence starting at n=871. This number has an interesting trajectory.',
    difficulty: 'medium',
    points: 10,
    parameters: { n: 871, compute_type: 'stopping_time' },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'collatz',
    type: 'VERIFY',
    title: 'Verify range 1000-2000',
    description:
      'Verify that all integers in the range 1000-2000 eventually reach 1 under the Collatz iteration.',
    difficulty: 'medium',
    points: 15,
    parameters: { range_start: 1000, range_end: 2000 },
    verification_type: 'automatic',
  },

  // Sidon set tasks
  {
    problem_slug: 'sidon',
    type: 'COMPUTE',
    title: 'Verify Sidon set {1,2,5,10}',
    description:
      'Verify whether the set {1, 2, 5, 10} is a valid Sidon set (all pairwise sums are distinct).',
    difficulty: 'easy',
    points: 5,
    parameters: { set: [1, 2, 5, 10], operation: 'verify' },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'sidon',
    type: 'COMPUTE',
    title: 'Verify Sidon set {1,2,5,11,19}',
    description: 'Verify whether the set {1, 2, 5, 11, 19} is a valid Sidon set.',
    difficulty: 'easy',
    points: 5,
    parameters: { set: [1, 2, 5, 11, 19], operation: 'verify' },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'sidon',
    type: 'COMPUTE',
    title: 'Find all Sidon sets of size 4 in [1,20]',
    description:
      'Find and enumerate all Sidon sets containing exactly 4 elements, where all elements are between 1 and 20 inclusive.',
    difficulty: 'medium',
    points: 15,
    parameters: { max_element: 20, set_size: 4, operation: 'enumerate' },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'sidon',
    type: 'COMPUTE',
    title: 'Find all Sidon sets of size 5 in [1,30]',
    description:
      'Find and enumerate all Sidon sets containing exactly 5 elements, where all elements are between 1 and 30 inclusive.',
    difficulty: 'hard',
    points: 25,
    parameters: { max_element: 30, set_size: 5, operation: 'enumerate' },
    verification_type: 'automatic',
  },
  {
    problem_slug: 'sidon',
    type: 'VERIFY',
    title: 'Verify {1,2,4,8,13} is maximal',
    description:
      'Verify that {1, 2, 4, 8, 13} is a valid Sidon set and determine if it is maximal (cannot be extended) within [1, 20].',
    difficulty: 'medium',
    points: 10,
    parameters: { set: [1, 2, 4, 8, 13], max_element: 20, operation: 'verify_maximal' },
    verification_type: 'automatic',
  },
]

async function seed() {
  console.log('Starting database seed...\n')

  // Insert problems
  console.log('Inserting problems...')
  const { data: insertedProblems, error: problemsError } = await supabase
    .from('problems')
    .upsert(problems, { onConflict: 'slug' })
    .select()

  if (problemsError) {
    console.error('Error inserting problems:', problemsError)
    process.exit(1)
  }

  console.log(`Inserted ${insertedProblems?.length || 0} problems`)

  // Create a map of slug to problem ID
  const problemMap = new Map<string, string>()
  for (const problem of insertedProblems || []) {
    problemMap.set(problem.slug, problem.id)
    console.log(`  - ${problem.slug}: ${problem.id}`)
  }

  // Insert tasks
  console.log('\nInserting tasks...')
  const tasksToInsert = tasks.map((task) => {
    const problemId = problemMap.get(task.problem_slug)
    if (!problemId) {
      throw new Error(`Problem not found for slug: ${task.problem_slug}`)
    }
    return {
      problem_id: problemId,
      type: task.type,
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      points: task.points,
      parameters: task.parameters,
      verification_type: task.verification_type,
      status: 'open' as const,
    }
  })

  const { data: insertedTasks, error: tasksError } = await supabase
    .from('tasks')
    .upsert(tasksToInsert, { onConflict: 'id', ignoreDuplicates: false })
    .select()

  if (tasksError) {
    console.error('Error inserting tasks:', tasksError)
    process.exit(1)
  }

  console.log(`Inserted ${insertedTasks?.length || 0} tasks`)
  for (const task of insertedTasks || []) {
    console.log(`  - [${task.type}] ${task.title} (${task.difficulty}, ${task.points} pts)`)
  }

  console.log('\nSeed completed successfully!')
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
