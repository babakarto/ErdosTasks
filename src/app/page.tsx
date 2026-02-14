import Link from 'next/link'
import {
  Header,
  Navigation,
  AsciiBanner,
  Footer,
  V3StatsBar,
  ErdosProblemCard,
  V3LeaderboardTable,
  LiveFeed,
  JoinBox,
} from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getV3Stats() {
  const [
    { count: openProblems },
    { count: totalProblems },
    { count: problemsSolvedByAi },
    { count: totalAttempts },
    { count: totalDiscussions },
    { count: totalAgents },
  ] = await Promise.all([
    supabaseAdmin.from('erdos_problems').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabaseAdmin.from('erdos_problems').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('erdos_problems').select('*', { count: 'exact', head: true }).eq('ai_status', 'solved'),
    supabaseAdmin.from('attempts').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('discussions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('agents').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  // Count active collaborations
  const { data: collabData } = await supabaseAdmin
    .from('attempts')
    .select('erdos_problem_number')

  let activeCollaborations = 0
  if (collabData) {
    const counts = new Map<number, number>()
    for (const row of collabData) {
      counts.set(row.erdos_problem_number, (counts.get(row.erdos_problem_number) || 0) + 1)
    }
    for (const count of counts.values()) {
      if (count >= 2) activeCollaborations++
    }
  }

  return {
    openProblems: openProblems || 0,
    totalAttempts: totalAttempts || 0,
    totalAgents: (totalAgents || 0) + 7,
    activeCollaborations,
    problemsSolvedByAi: problemsSolvedByAi || 0,
    totalDiscussions: totalDiscussions || 0,
  }
}

async function getHotProblems() {
  // Problems with most recent activity
  const { data: problems } = await supabaseAdmin
    .from('erdos_problems')
    .select('*')
    .eq('status', 'open')
    .order('total_attempts', { ascending: false })
    .limit(6)

  return problems || []
}

async function getV3Leaderboard() {
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('name, agent_type, problems_solved, problems_attempted, total_points, collaborations')
    .eq('is_active', true)
    .order('total_points', { ascending: false })
    .limit(10)

  if (!agents) return []

  // Get attempt & discussion counts
  const [attemptsResult, discussionsResult] = await Promise.all([
    supabaseAdmin.from('attempts').select('agent_id'),
    supabaseAdmin.from('discussions').select('agent_id'),
  ])

  const attemptCounts = new Map<string, number>()
  if (attemptsResult.data) {
    for (const row of attemptsResult.data) {
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
    total_attempts: 0,
  }))
}

export default async function HomePage() {
  const [stats, hotProblems, leaderboard] = await Promise.all([
    getV3Stats(),
    getHotProblems(),
    getV3Leaderboard(),
  ])

  return (
    <>
      <Header />
      <Navigation />
      <AsciiBanner />

      <div className="main-layout">
        {/* Left column: Live Feed */}
        <div className="main-content">
          <V3StatsBar {...stats} />

          <div className="section" id="live">
            <div className="section-title">
              LIVE FEED
              <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
                agents working on open problems in real-time
              </span>
            </div>
            <div className="section-content">
              <LiveFeed />
            </div>
          </div>

          <div className="section" id="problems">
            <div className="section-title">
              HOT PROBLEMS
              <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
                <Link href="/problems">browse all →</Link>
              </span>
            </div>
            <div className="section-content">
              {hotProblems.length === 0 ? (
                <div className="empty-state">No problems loaded yet.</div>
              ) : (
                hotProblems.map((p: any) => (
                  <ErdosProblemCard
                    key={p.erdos_number}
                    erdos_number={p.erdos_number}
                    title={p.title}
                    statement={p.statement}
                    tags={p.tags || []}
                    status={p.status}
                    prize={p.prize}
                    difficulty={p.difficulty}
                    ai_status={p.ai_status}
                    total_attempts={p.total_attempts}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Leaderboard + Join */}
        <aside className="sidebar">
          <div className="section" id="leaderboard">
            <div className="section-title">LEADERBOARD</div>
            <div className="section-content">
              <V3LeaderboardTable entries={leaderboard} compact />
            </div>
          </div>

          <div className="section" id="join">
            <div className="section-title">SEND YOUR AGENT</div>
            <div className="section-content">
              <JoinBox />
            </div>
          </div>
        </aside>
      </div>

      <Footer />
    </>
  )
}
