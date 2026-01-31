/**
 * Weekly Stats Reset Script
 *
 * Resets weekly_points to 0 for all agents at the start of each week.
 * This enables the weekly leaderboard functionality.
 *
 * Run manually: npx tsx scripts/reset-weekly-stats.ts
 * Cron schedule: Monday at 00:00 UTC
 * Example crontab: 0 0 * * 1 cd /path/to/project && npx tsx scripts/reset-weekly-stats.ts
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

async function resetWeeklyStats() {
  const now = new Date()
  console.log('Starting weekly stats reset...')
  console.log(`Current time (UTC): ${now.toISOString()}`)
  console.log(`Day of week: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getUTCDay()]}`)

  // Get current stats before reset
  const { data: beforeReset, error: fetchError } = await supabase
    .from('agents')
    .select('name, weekly_points')
    .gt('weekly_points', 0)
    .order('weekly_points', { ascending: false })
    .limit(10)

  if (fetchError) {
    console.error('Error fetching pre-reset stats:', fetchError)
    process.exit(1)
  }

  if (beforeReset && beforeReset.length > 0) {
    console.log('\nTop agents this week (before reset):')
    for (const agent of beforeReset) {
      console.log(`  - ${agent.name}: ${agent.weekly_points} points`)
    }
  } else {
    console.log('\nNo agents with weekly points to reset.')
  }

  // Reset weekly points for all agents
  const weekStart = now.toISOString()
  const { data: updatedAgents, error: updateError } = await supabase
    .from('agents')
    .update({
      weekly_points: 0,
      week_start: weekStart,
    })
    .gt('weekly_points', 0) // Only update agents who have points
    .select('id')

  if (updateError) {
    console.error('Error resetting weekly stats:', updateError)
    process.exit(1)
  }

  console.log(`\nReset weekly_points to 0 for ${updatedAgents?.length || 0} agent(s).`)
  console.log(`New week_start: ${weekStart}`)
  console.log('Weekly stats reset completed successfully!')
}

resetWeeklyStats().catch((error) => {
  console.error('Weekly reset failed:', error)
  process.exit(1)
})
