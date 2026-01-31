/**
 * Task Pool Maintenance Script
 *
 * Maintains a minimum pool of open tasks. When the count falls below
 * the threshold, new tasks are generated automatically.
 *
 * Run manually: npx tsx scripts/maintain-task-pool.ts
 * Cron schedule: hourly
 * Example crontab: 0 * * * * cd /path/to/project && npx tsx scripts/maintain-task-pool.ts
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

// Configuration
const MINIMUM_OPEN_TASKS = 20
const TASKS_TO_GENERATE = 10 // Number of tasks to generate when below minimum

// Import task generators (must match the exported types)
import {
  generateBalancedTasks,
  SUPPORTED_PROBLEMS,
  type SupportedProblem,
} from '../src/lib/task-generator'

async function maintainTaskPool() {
  console.log('Starting task pool maintenance...')
  console.log(`Minimum open tasks required: ${MINIMUM_OPEN_TASKS}`)

  // Count current open tasks
  const { count: openCount, error: countError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  if (countError) {
    console.error('Error counting open tasks:', countError)
    process.exit(1)
  }

  console.log(`Current open tasks: ${openCount}`)

  if (openCount !== null && openCount >= MINIMUM_OPEN_TASKS) {
    console.log('Task pool is sufficient. No generation needed.')
    return
  }

  // Calculate how many tasks to generate
  const tasksNeeded = MINIMUM_OPEN_TASKS - (openCount || 0)
  const tasksToGenerate = Math.max(tasksNeeded, TASKS_TO_GENERATE)

  console.log(`Generating ${tasksToGenerate} new tasks...`)

  // Get existing task parameters for duplicate detection
  const { data: existingTasks, error: fetchError } = await supabase
    .from('tasks')
    .select('parameters')

  if (fetchError) {
    console.error('Error fetching existing tasks:', fetchError)
    process.exit(1)
  }

  const existingParameters = new Set<string>()
  for (const task of existingTasks || []) {
    existingParameters.add(JSON.stringify(task.parameters))
  }

  // Get problem IDs for mapping
  const { data: problems, error: problemsError } = await supabase
    .from('problems')
    .select('id, slug')

  if (problemsError) {
    console.error('Error fetching problems:', problemsError)
    process.exit(1)
  }

  const problemMap = new Map<string, string>()
  for (const problem of problems || []) {
    problemMap.set(problem.slug, problem.id)
  }

  // Verify all required problems exist
  for (const slug of SUPPORTED_PROBLEMS) {
    if (!problemMap.has(slug)) {
      console.error(`Error: Problem '${slug}' not found in database. Run seed script first.`)
      process.exit(1)
    }
  }

  // Generate tasks
  const generatedTasks = generateBalancedTasks(tasksToGenerate, existingParameters)

  console.log(`Generated ${generatedTasks.length} tasks. Inserting into database...`)

  // Prepare tasks for insertion
  const tasksToInsert = generatedTasks.map((task) => {
    const problemId = problemMap.get(task.problem as SupportedProblem)
    if (!problemId) {
      throw new Error(`Problem ID not found for: ${task.problem}`)
    }
    return {
      problem_id: problemId,
      type: task.type,
      title: task.title,
      description: task.description,
      difficulty: task.difficulty,
      points: task.points,
      parameters: task.parameters,
      verification_type: 'automatic' as const,
      status: 'open' as const,
    }
  })

  // Insert tasks
  const { data: insertedTasks, error: insertError } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select()

  if (insertError) {
    console.error('Error inserting tasks:', insertError)
    process.exit(1)
  }

  console.log(`\nInserted ${insertedTasks?.length || 0} tasks:`)
  for (const task of insertedTasks || []) {
    console.log(`  - [${task.type}] ${task.title} (${task.difficulty}, ${task.points} pts)`)
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  console.log(`\nFinal open task count: ${finalCount}`)
  console.log('Task pool maintenance completed successfully!')
}

maintainTaskPool().catch((error) => {
  console.error('Maintenance failed:', error)
  process.exit(1)
})
