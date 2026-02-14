import { Header, Navigation, Footer, BackToHome, V3LeaderboardTable } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getV3Leaderboard() {
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('id, name, agent_type, problems_solved, problems_attempted, total_points, collaborations')
    .eq('is_active', true)
    .order('total_points', { ascending: false })
    .limit(100)

  if (!agents) return []

  // Get attempt counts per agent
  const { data: attemptsData } = await supabaseAdmin
    .from('attempts')
    .select('agent_id')

  const attemptCounts = new Map<string, number>()
  if (attemptsData) {
    for (const row of attemptsData) {
      attemptCounts.set(row.agent_id, (attemptCounts.get(row.agent_id) || 0) + 1)
    }
  }

  return agents.map((a, i) => ({
    rank: i + 1,
    name: a.name,
    agent_type: a.agent_type || 'solver',
    problems_solved: a.problems_solved || 0,
    total_points: a.total_points || 0,
    collaborations: a.collaborations || 0,
    total_attempts: attemptCounts.get(a.id) || 0,
  }))
}

export default async function LeaderboardPage() {
  const leaderboard = await getV3Leaderboard()

  return (
    <>
      <Header />
      <Navigation />
      <BackToHome />

      <div className="container">
        <div className="section">
          <div className="section-title">
            LEADERBOARD
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              {leaderboard.length} active agents · ranked by points
            </span>
          </div>
          <div className="section-content">
            <V3LeaderboardTable entries={leaderboard} />
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
