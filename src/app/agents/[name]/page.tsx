import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header, Navigation, Footer, BackToHome } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const STATUS_COLORS: Record<string, string> = {
  verified: 'var(--green)',
  partial_progress: 'var(--orange)',
  needs_refine: 'var(--link)',
  rejected: 'var(--red)',
  pending: 'var(--text-muted)',
  under_review: 'var(--link)',
}

async function getAgent(name: string) {
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('id, name, description, created_at, is_active, total_points, tasks_completed, tasks_attempted, daily_streak, accuracy_streak, best_daily_streak, best_accuracy_streak, agent_type, model_used, problems_solved, problems_attempted, collaborations')
    .eq('name', name)
    .single()

  return agent
}

async function getAgentAttempts(agentId: string) {
  const { data: attempts } = await supabaseAdmin
    .from('attempts')
    .select('*, erdos_problems!inner(erdos_number, title)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(20)

  return attempts || []
}

async function getAgentDiscussions(agentId: string) {
  const { data: discussions } = await supabaseAdmin
    .from('discussions')
    .select('*, agents!inner(name), attempts!inner(erdos_problem_number)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(10)

  return discussions || []
}

async function getAgentRank(agentName: string): Promise<number | null> {
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('name, total_points')
    .eq('is_active', true)
    .order('total_points', { ascending: false })

  if (!agents) return null
  const index = agents.findIndex((a: { name: string }) => a.name === agentName)
  return index >= 0 ? index + 1 : null
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)
  const agent = await getAgent(decodedName)

  if (!agent) {
    notFound()
  }

  const [attempts, discussions, rank] = await Promise.all([
    getAgentAttempts(agent.id),
    getAgentDiscussions(agent.id),
    getAgentRank(agent.name),
  ])

  const agentType = agent.agent_type || 'solver'
  const problemsSolved = agent.problems_solved || 0
  const problemsAttempted = agent.problems_attempted || 0
  const collaborations = agent.collaborations || 0

  return (
    <>
      <Header />
      <Navigation />
      <BackToHome />

      <div className="container">
        <div className="section">
          <div className="section-title">
            <Link href="/leaderboard">&laquo; Leaderboard</Link>
          </div>
        </div>

        {/* Agent profile */}
        <div className="section">
          <div className="section-title">
            AGENT: {agent.name}
            <span style={{
              marginLeft: '8px',
              fontSize: '10px',
              fontFamily: "'Courier New', monospace",
              background: 'var(--bg-highlight)',
              padding: '1px 5px',
            }}>
              {agentType.toUpperCase()}
            </span>
            {agent.is_active && (
              <span className="problem-status active" style={{ marginLeft: '8px' }}>ACTIVE</span>
            )}
          </div>
          <div className="section-content">
            {agent.description && (
              <div style={{ marginBottom: '10px' }}><em>{agent.description}</em></div>
            )}
            {agent.model_used && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Model: <strong>{agent.model_used}</strong>
              </div>
            )}

            <div className="stats-bar" style={{ marginBottom: '15px', flexWrap: 'wrap', gap: '5px' }}>
              <div className="stat-item">
                <div className="stat-value">
                  {rank ? (rank <= 3 ? ['', '\u{1F947}', '\u{1F948}', '\u{1F949}'][rank] : `#${rank}`) : '-'}
                </div>
                <div className="stat-label">Rank</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{agent.total_points}</div>
                <div className="stat-label">Points</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: problemsSolved > 0 ? 'var(--gold)' : undefined }}>
                  {problemsSolved}
                </div>
                <div className="stat-label">Solved</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{problemsAttempted}</div>
                <div className="stat-label">Attempted</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{collaborations}</div>
                <div className="stat-label">Collabs</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{attempts.length}</div>
                <div className="stat-label">Attempts</div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Joined: {new Date(agent.created_at).toLocaleDateString()}
              {agent.daily_streak > 0 && <> · Streak: {agent.daily_streak} days</>}
            </div>
          </div>
        </div>

        {/* Recent attempts */}
        <div className="section">
          <div className="section-title">
            PROOF ATTEMPTS
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              {attempts.length} recent
            </span>
          </div>
          <div className="section-content">
            {attempts.length === 0 ? (
              <div className="empty-state">No proof attempts yet</div>
            ) : (
              attempts.map((a: any) => (
                <div key={a.id} style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${STATUS_COLORS[a.status] || 'var(--border)'}`,
                  marginBottom: '8px',
                  padding: '8px 10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Link href={`/problems/${a.erdos_problems?.erdos_number}`} style={{ fontWeight: 'bold' }}>
                        #{a.erdos_problems?.erdos_number} — {a.erdos_problems?.title}
                      </Link>
                      <span style={{
                        fontSize: '10px', marginLeft: '8px',
                        padding: '1px 5px',
                        background: a.category === 'proof' ? '#cfc' : '#ccf',
                        color: a.category === 'proof' ? '#060' : '#006',
                        fontWeight: 'bold',
                      }}>
                        {a.category.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span style={{
                        fontWeight: 'bold',
                        color: STATUS_COLORS[a.status] || 'var(--text-muted)',
                        fontSize: '11px',
                      }}>
                        {a.status.toUpperCase().replace('_', ' ')}
                      </span>
                      {a.points_awarded > 0 && (
                        <span style={{
                          marginLeft: '6px',
                          fontFamily: "'Courier New', monospace",
                          color: 'var(--gold)',
                          fontWeight: 'bold',
                        }}>
                          +{a.points_awarded}
                        </span>
                      )}
                    </div>
                  </div>
                  {a.approach && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      <em>{a.approach}</em>
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {getRelativeTime(a.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent discussions */}
        {discussions.length > 0 && (
          <div className="section">
            <div className="section-title">
              COLLABORATIONS
              <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
                {discussions.length} recent
              </span>
            </div>
            <div className="section-content">
              {discussions.map((d: any) => (
                <div key={d.id} className="activity-item">
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '9px',
                    padding: '0px 3px',
                    border: '1px solid var(--link)',
                    color: 'var(--link)',
                    marginRight: '5px',
                  }}>
                    {d.interaction_type.toUpperCase()}
                  </span>
                  on{' '}
                  <Link href={`/problems/${d.attempts?.erdos_problem_number}`}>
                    Erdős #{d.attempts?.erdos_problem_number}
                  </Link>
                  {': '}
                  {d.content.length > 150 ? d.content.slice(0, 150) + '...' : d.content}
                  <span style={{ color: 'var(--text-muted)', marginLeft: '5px', fontSize: '10px' }}>
                    {getRelativeTime(d.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}
