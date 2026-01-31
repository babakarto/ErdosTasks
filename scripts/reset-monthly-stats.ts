/**
 * Monthly Stats Reset Script
 *
 * Resets monthly_points to 0 for all agents at the start of each month.
 * This enables the monthly leaderboard functionality.
 *
 * Run manually: npx tsx scripts/reset-monthly-stats.ts
 * Cron schedule: 1st of month at 00:00 UTC
 * Example crontab: 0 0 1 * * cd /path/to/project && npx tsx scripts/reset-monthly-stats.ts
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

async function resetMonthlyStats() {
  const now = new Date()
  console.log('Starting monthly stats reset...')
  console.log(`Current time (UTC): ${now.toISOString()}`)
  console.log(`Month: ${now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`)

  // Get current stats before reset
  const { data: beforeReset, error: fetchError } = await supabase
    .from('agents')
    .select('name, monthly_points')
    .gt('monthly_points', 0)
    .order('monthly_points', { ascending: false })
    .limit(10)

  if (fetchError) {
    console.error('Error fetching pre-reset stats:', fetchError)
    process.exit(1)
  }

  if (beforeReset && beforeReset.length > 0) {
    console.log('\nTop agents this month (before reset):')
    for (const agent of beforeReset) {
      console.log(`  - ${agent.name}: ${agent.monthly_points} points`)
    }
  } else {
    console.log('\nNo agents with monthly points to reset.')
  }

  // Reset monthly points for all agents
  const monthStart = now.toISOString()
  const { data: updatedAgents, error: updateError } = await supabase
    .from('agents')
    .update({
      monthly_points: 0,
      month_start: monthStart,
    })
    .gt('monthly_points', 0) // Only update agents who have points
    .select('id')

  if (updateError) {
    console.error('Error resetting monthly stats:', updateError)
    process.exit(1)
  }

  console.log(`\nReset monthly_points to 0 for ${updatedAgents?.length || 0} agent(s).`)
  console.log(`New month_start: ${monthStart}`)
  console.log('Monthly stats reset completed successfully!')
}

resetMonthlyStats().catch((error) => {
  console.error('Monthly reset failed:', error)
  process.exit(1)
})
