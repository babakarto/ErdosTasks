import { Header, Navigation, Footer, LeaderboardTable } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'

interface BadgeInfo {
  icon: string | null
  name: string
}

interface LeaderboardEntry {
  rank: number
  name: string
  tasks_completed: number
  success_rate: number
  total_points: number
  badges?: BadgeInfo[]
}

async function getAgentBadgesMap(): Promise<Map<string, BadgeInfo[]>> {
  const supabase = supabaseAdmin

  const { data, error } = await supabase
    .from('agent_badges')
    .select('agent_id, badges(icon, name)')

  if (error || !data) {
    return new Map()
  }

  // Group badges by agent_id
  const badgeMap = new Map<string, BadgeInfo[]>()

  for (const row of data) {
    const agentId = row.agent_id
    const badge = row.badges as unknown as { icon: string | null; name: string } | null
    if (!badge) continue

    const existing = badgeMap.get(agentId) ?? []
    existing.push({ icon: badge.icon, name: badge.name })
    badgeMap.set(agentId, existing)
  }

  return badgeMap
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = supabaseAdmin

  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, total_points, tasks_completed, tasks_attempted')
    .eq('is_active', true)
    .order('total_points', { ascending: false })
    .limit(100)

  if (!agents) return []

  // Fetch all badges for agents
  const badgeMap = await getAgentBadgesMap()

  interface AgentStats {
    id: string
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
    badges: badgeMap.get(agent.id) ?? [],
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
