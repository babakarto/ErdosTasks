import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header, Navigation, Footer, TaskList, BackToHome } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Problem, Task } from '@/types/database'

interface TaskWithProblem extends Task {
  problem: Problem
}

async function getProblem(slug: string) {
  const supabase = supabaseAdmin

  const { data: problem, error } = await supabase
    .from('problems')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !problem) {
    return null
  }

  return problem as Problem
}

async function getTasksForProblem(problemId: string) {
  const supabase = supabaseAdmin

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, problem:problems(*)')
    .eq('problem_id', problemId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(10)

  return (tasks || []) as TaskWithProblem[]
}

async function getTaskCounts(problemId: string) {
  const supabase = supabaseAdmin

  const [{ count: openTasks }, { count: completedTasks }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('problem_id', problemId)
      .eq('status', 'open'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('problem_id', problemId)
      .eq('status', 'completed'),
  ])

  return {
    open: openTasks || 0,
    completed: completedTasks || 0,
  }
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const problem = await getProblem(slug)

  if (!problem) {
    notFound()
  }

  const [tasks, counts] = await Promise.all([
    getTasksForProblem(problem.id),
    getTaskCounts(problem.id),
  ])

  const statusClass =
    problem.status === 'open' ? 'active' : problem.status === 'solved' ? 'solved' : 'disproved'
  const statusLabel =
    problem.status === 'open'
      ? 'ACTIVE'
      : problem.status === 'solved'
        ? 'SOLVED'
        : 'DISPROVED'

  return (
    <>
      <Header />
      <Navigation />
      <BackToHome />

      <div className="container">
        <div className="section">
          <div className="section-title">
            <Link href="/problems">&laquo; Back to Problems</Link>
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            {problem.name}
            <span className={`problem-status ${statusClass}`} style={{ marginLeft: '10px' }}>
              {statusLabel}
            </span>
          </div>
          <div className="section-content">
            {problem.formula && (
              <div className="problem-formula" style={{ marginBottom: '15px' }}>
                {problem.formula}
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <p>{problem.description}</p>
            </div>

            {problem.year_proposed && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Year Proposed:</strong> {problem.year_proposed}
              </div>
            )}

            {problem.verified_to && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Verified To:</strong> {problem.verified_to}
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <strong>Task Statistics:</strong> {counts.open} open · {counts.completed} completed
            </div>

            <div className="join-box" style={{ marginTop: '20px' }}>
              <h3>&gt; SOLVING TIPS</h3>
              <ul style={{ marginLeft: '20px', fontSize: '12px' }}>
                {problem.slug === 'erdos-straus' && (
                  <>
                    <li>For small n, try systematic search with x &le; y &le; z</li>
                    <li>Start with x = ceil(n/4) and iterate</li>
                    <li>Use BigInt for large denominators to avoid overflow</li>
                    <li>Many solutions exist for each n - find any valid one</li>
                  </>
                )}
                {problem.slug === 'collatz' && (
                  <>
                    <li>Use BigInt for sequences that grow very large</li>
                    <li>Stopping time = steps until reaching 1</li>
                    <li>Max value = highest number in the sequence</li>
                    <li>Memoize visited numbers for range verification</li>
                  </>
                )}
                {problem.slug === 'sidon' && (
                  <>
                    <li>All pairwise sums a+b (where a &lt; b) must be unique</li>
                    <li>Use backtracking for enumeration tasks</li>
                    <li>Check sum uniqueness incrementally for efficiency</li>
                    <li>Maximal sets cannot be extended within the bounds</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            OPEN TASKS
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              {counts.open} available
            </span>
          </div>
          <div className="section-content">
            <TaskList tasks={tasks} emptyMessage="No open tasks for this problem" />
            {counts.open > 10 && (
              <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>
                <Link href={`/tasks?problem=${problem.slug}`}>
                  View all {counts.open} tasks →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
