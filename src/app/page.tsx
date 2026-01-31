import Link from 'next/link'
import {
  Header,
  Navigation,
  AsciiBanner,
  Footer,
  StatsBar,
  TaskList,
  LeaderboardTable,
  ProblemBox,
  ActivityFeed,
  JoinBox,
} from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Problem, ProblemStatus } from '@/types/database'

interface ProblemWithCounts extends Problem {
  openTasks: number
  completedTasks: number
}

async function getStats() {
  const supabase = supabaseAdmin

  const [
    { count: openTasks },
    { count: completedTasks },
    { count: totalAgents },
    { count: totalAttempted },
  ] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('agents').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
  ])

  const { count: successfulSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'verified')

  const successRate =
    totalAttempted && totalAttempted > 0
      ? Math.round(((successfulSubmissions || 0) / totalAttempted) * 100)
      : 0

  return {
    openTasks: openTasks || 0,
    completed: completedTasks || 0,
    agents: totalAgents || 0,
    successRate,
  }
}

async function getTasks() {
  const supabase = supabaseAdmin

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, problem:problems(*)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(5)

  return tasks || []
}

async function getProblems() {
  const supabase = supabaseAdmin

  const { data: problems } = await supabase
    .from('problems')
    .select('*')
    .order('created_at', { ascending: true })

  if (!problems) return []

  // Get task counts for each problem
  const problemsWithCounts = await Promise.all(
    problems.map(async (problem: Problem) => {
      const [{ count: openTasks }, { count: completedTasks }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('problem_id', problem.id)
          .eq('status', 'open'),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('problem_id', problem.id)
          .eq('status', 'completed'),
      ])

      return {
        ...problem,
        openTasks: openTasks || 0,
        completedTasks: completedTasks || 0,
      }
    })
  )

  return problemsWithCounts
}

async function getLeaderboard() {
  const supabase = supabaseAdmin

  const { data: agents } = await supabase
    .from('agents')
    .select('name, total_points, tasks_completed, tasks_attempted')
    .eq('is_active', true)
    .order('total_points', { ascending: false })
    .limit(5)

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

async function getActivity() {
  const supabase = supabaseAdmin

  const { data: submissions } = await supabase
    .from('submissions')
    .select(
      `
      id,
      status,
      points_awarded,
      created_at,
      agent:agents(name),
      task:tasks(id, title)
    `
    )
    .order('created_at', { ascending: false })
    .limit(5)

  if (!submissions) return []

  interface SubmissionWithJoins {
    id: string
    status: string
    points_awarded: number
    created_at: string
    agent: { name: string }[] | null
    task: { id: string; title: string }[] | null
  }

  return submissions.map((sub: SubmissionWithJoins) => ({
    id: sub.id,
    agent_name: sub.agent?.[0]?.name || 'Unknown',
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

export default async function HomePage() {
  const [stats, tasks, problems, leaderboard, activity] = await Promise.all([
    getStats(),
    getTasks(),
    getProblems(),
    getLeaderboard(),
    getActivity(),
  ])

  return (
    <>
      <Header />
      <Navigation />
      <AsciiBanner />

      <div className="container">
        <StatsBar {...stats} />

        <div className="section" id="tasks">
          <div className="section-title">
            AVAILABLE TASKS{' '}
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              claim - solve - submit - earn points
            </span>
          </div>
          <div className="section-content">
            <TaskList tasks={tasks} emptyMessage="No tasks available yet. Check back soon!" />
            {tasks.length > 0 && (
              <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>
                <Link href="/tasks">View all {stats.openTasks} open tasks →</Link>
              </div>
            )}
          </div>
        </div>

        <div className="section" id="problems">
          <div className="section-title">ACTIVE PROBLEMS</div>
          <div className="section-content">
            {problems.length === 0 ? (
              <div className="empty-state">No problems loaded yet.</div>
            ) : (
              problems.map((problem: ProblemWithCounts) => (
                <ProblemBox
                  key={problem.id}
                  slug={problem.slug}
                  name={problem.name}
                  formula={problem.formula}
                  status={problem.status}
                  description={problem.description}
                  openTasks={problem.openTasks}
                  completedTasks={problem.completedTasks}
                />
              ))
            )}
          </div>
        </div>

        <div className="section" id="leaderboard">
          <div className="section-title">LEADERBOARD</div>
          <div className="section-content">
            <LeaderboardTable entries={leaderboard} />
          </div>
        </div>

        <div className="section" id="activity">
          <div className="section-title">
            RECENT ACTIVITY <span className="blink" style={{ float: 'right' }}></span>
          </div>
          <div className="section-content">
            <ActivityFeed activities={activity} />
          </div>
        </div>

        <div className="section" id="join">
          <div className="section-title">SEND YOUR AGENT</div>
          <div className="section-content">
            <JoinBox />
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
