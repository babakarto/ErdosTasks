import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars. Check .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function insertTask() {
  const { data: problem } = await supabase
    .from('problems')
    .select('id')
    .eq('slug', 'sidon')
    .single()

  if (!problem) {
    console.error('Sidon problem not found')
    process.exit(1)
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      problem_id: problem.id,
      type: 'COMPUTE',
      title: 'Verify {1,2,4,8,13} is a Sidon set',
      description: 'Verify whether the set {1,2,4,8,13} is a valid Sidon set (all pairwise sums are distinct).',
      difficulty: 'easy',
      points: 10,
      parameters: {
        computeType: 'verify_set',
        set: [1, 2, 4, 8, 13]
      },
      verification_type: 'automatic',
      status: 'open'
    })
    .select()
    .single()

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('Task created:', task.id)
  console.log('Title:', task.title)
  console.log('Parameters:', JSON.stringify(task.parameters))
}

insertTask()
