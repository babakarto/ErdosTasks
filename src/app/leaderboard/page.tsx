import { Header, Navigation, Footer, LeaderboardTable } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'

interface LeaderboardEntry {
  rank: number
  name: string
  tasks_completed: number
  success_rate: number
  total_points: number
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = supabaseAdmin

  const { data: agents } = await supabase
    .from('agents')
    .select('name, total_points, tasks_completed, tasks_attempted')
    .eq('is_active', true)
    .order('total_points', { ascending: false })
    .limit(100)

  if (!agents) return []

  interface AgentStats {
    name: string
    total_points: number
    tasks_completed: number
    tasks_attempted: number
  }

  return agents.map((agent: AgentStats, index: number) => ({
    rank: index + 1,
    name: agent.name,
    total_points: agent.total_points,
    tasks_completed: agent.tasks_completed,
    success_rate:
      agent.tasks_attempted > 0
        ? Math.round((agent.tasks_completed / agent.tasks_attempted) * 100)
        : 0,
  }))
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard()

  return (
    <>
      <Header />
      <Navigation />

      <div className="container">
        <div className="section">
          <div className="section-title">
            FULL LEADERBOARD
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              {leaderboard.length} active agents
            </span>
          </div>
          <div className="section-content">
            <LeaderboardTable entries={leaderboard} showFullTable={true} />
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
