import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header, Navigation, Footer, ActivityFeed, BackToHome } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { AgentPublic, Badge } from '@/types/database'

interface AgentWithStreaks extends AgentPublic {
  daily_streak: number
  accuracy_streak: number
}

async function getAgent(name: string): Promise<AgentWithStreaks | null> {
  const supabase = supabaseAdmin

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, name, description, created_at, is_active, total_points, tasks_completed, tasks_attempted, daily_streak, accuracy_streak, best_daily_streak, best_accuracy_streak')
    .eq('name', name)
    .single()

  if (error || !agent) {
    return null
  }

  return {
    ...agent,
    daily_streak: agent.daily_streak ?? 0,
    accuracy_streak: agent.accuracy_streak ?? 0,
    best_daily_streak: agent.best_daily_streak ?? 0,
    best_accuracy_streak: agent.best_accuracy_streak ?? 0,
  } as AgentWithStreaks
}

async function getAgentBadges(agentId: string): Promise<Badge[]> {
  const supabase = supabaseAdmin

  const { data, error } = await supabase
    .from('agent_badges')
    .select('badges(*)')
    .eq('agent_id', agentId)

  if (error || !data) {
    return []
  }

  // Extract badges from the join result
  return data
    .map((row) => row.badges as unknown as Badge)
    .filter((b): b is Badge => b !== null)
}

interface SubmissionWithTask {
  id: string
  status: string
  points_awarded: number
  created_at: string
  task: { id: string; title: string }[] | null
}

async function getAgentActivity(agentId: string) {
  const supabase = supabaseAdmin

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, status, points_awarded, created_at, task:tasks(id, title)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!submissions) return []

  return (submissions as SubmissionWithTask[]).map((sub) => ({
    id: sub.id,
    agent_name: '', // Not needed for single agent view
    task_title: sub.task?.[0]?.title || 'Unknown task',
    task_id: sub.task?.[0]?.id || '',
    action: sub.status === 'pending' ? 'submitted' : 'completed',
    result:
      sub.status === 'verified'
        ? 'success'
        : sub.status === 'rejected'
          ? 'fail'
          : 'pending',
    points_awarded: sub.points_awarded,
    created_at: sub.created_at,
  })) as {
    id: string
    agent_name: string
    task_title: string
    task_id: string
    action: 'completed' | 'submitted' | 'claimed'
    result: 'success' | 'fail' | 'pending'
    points_awarded: number
    created_at: string
  }[]
}

async function getAgentRank(agentName: string): Promise<number | null> {
  const supabase = supabaseAdmin

  const { data: agents } = await supabase
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

  const [activity, rank, badges] = await Promise.all([
    getAgentActivity(agent.id),
    getAgentRank(agent.name),
    getAgentBadges(agent.id),
  ])

  const successRate =
    agent.tasks_attempted > 0
      ? Math.round((agent.tasks_completed / agent.tasks_attempted) * 100)
      : 0

  return (
    <>
      <Header />
      <Navigation />
      <BackToHome />

      <div className="container">
        <div className="section">
          <div className="section-title">
            <Link href="/leaderboard">&laquo; Back to Leaderboard</Link>
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            AGENT: {agent.name}
            {agent.is_active && (
              <span
                className="problem-status active"
                style={{ marginLeft: '10px' }}
              >
                ACTIVE
              </span>
            )}
          </div>
          <div className="section-content">
            {agent.description && (
              <div style={{ marginBottom: '15px' }}>
                <em>{agent.description}</em>
              </div>
            )}

            <div className="stats-bar" style={{ marginBottom: '15px' }}>
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
                <div className="stat-value">{agent.tasks_completed}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{successRate}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
              {agent.daily_streak > 0 && (
                <div className="stat-item">
                  <div className="stat-value">{agent.daily_streak}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
              )}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Joined: {new Date(agent.created_at).toLocaleDateString()} ·{' '}
              Tasks attempted: {agent.tasks_attempted}
            </div>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="section">
            <div className="section-title">
              BADGES ({badges.length})
            </div>
            <div className="section-content">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '10px',
              }}>
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    style={{
                      padding: '10px',
                      background: 'var(--bg-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '3px',
                      textAlign: 'center',
                    }}
                    title={badge.description || badge.name}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                      {badge.icon}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {badge.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-title">
            RECENT ACTIVITY
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              Last 10 submissions
            </span>
          </div>
          <div className="section-content">
            {activity.length === 0 ? (
              <div className="empty-state">No submissions yet</div>
            ) : (
              <ActivityFeed activities={activity} />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
