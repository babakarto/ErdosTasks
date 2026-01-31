/**
 * Expired Claim Cleanup Script
 *
 * Finds tasks with expired claims (claimed_at + 1 hour < now) and resets them
 * to 'open' status so other agents can claim them.
 *
 * Run manually: npx tsx scripts/cleanup-expired-claims.ts
 * Cron schedule: every 15 minutes
 * Example crontab: *​/15 * * * * cd /path/to/project && npx tsx scripts/cleanup-expired-claims.ts
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

// Claim expiration time: 1 hour
const CLAIM_DURATION_MS = 60 * 60 * 1000

async function cleanupExpiredClaims() {
  console.log('Starting expired claim cleanup...')
  console.log(`Current time: ${new Date().toISOString()}`)

  // Calculate the cutoff time (1 hour ago)
  const cutoffTime = new Date(Date.now() - CLAIM_DURATION_MS).toISOString()
  console.log(`Cutoff time (claims before this are expired): ${cutoffTime}`)

  // Find tasks with expired claims
  const { data: expiredTasks, error: fetchError } = await supabase
    .from('tasks')
    .select('id, title, claimed_by, claimed_at')
    .eq('status', 'claimed')
    .lt('claimed_at', cutoffTime)

  if (fetchError) {
    console.error('Error fetching expired claims:', fetchError)
    process.exit(1)
  }

  if (!expiredTasks || expiredTasks.length === 0) {
    console.log('No expired claims found.')
    return
  }

  console.log(`Found ${expiredTasks.length} expired claim(s):`)
  for (const task of expiredTasks) {
    console.log(`  - Task ${task.id}: "${task.title}" (claimed at ${task.claimed_at})`)
  }

  // Reset expired tasks to 'open' status
  const taskIds = expiredTasks.map((t) => t.id)
  const { data: updatedTasks, error: updateError } = await supabase
    .from('tasks')
    .update({
      status: 'open',
      claimed_by: null,
      claimed_at: null,
    })
    .in('id', taskIds)
    .select('id, title')

  if (updateError) {
    console.error('Error resetting expired claims:', updateError)
    process.exit(1)
  }

  console.log(`\nReset ${updatedTasks?.length || 0} task(s) to 'open' status.`)
  console.log('Cleanup completed successfully!')
}

cleanupExpiredClaims().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
