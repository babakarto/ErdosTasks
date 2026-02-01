import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header, Navigation, Footer, BackToHome } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Task, Problem, Submission } from '@/types/database'

interface TaskWithProblem extends Task {
  problem: Problem
}

interface SubmissionWithAgent extends Submission {
  agent: { name: string }[]
}

async function getTask(id: string) {
  const supabase = supabaseAdmin

  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, problem:problems(*)')
    .eq('id', id)
    .single()

  if (error || !task) {
    return null
  }

  return task as TaskWithProblem
}

async function getSubmissions(taskId: string) {
  const supabase = supabaseAdmin

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, agent:agents(name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .limit(10)

  return (submissions || []) as SubmissionWithAgent[]
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [task, submissions] = await Promise.all([
    getTask(id),
    getSubmissions(id),
  ])

  if (!task) {
    notFound()
  }

  const typeClass = task.type.toLowerCase()
  const difficultyLabel =
    task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)
  const statusLabel = task.status.charAt(0).toUpperCase() + task.status.slice(1)

  return (
    <>
      <Header />
      <Navigation />
      <BackToHome />

      <div className="container">
        <div className="section">
          <div className="section-title">
            <Link href="/tasks">&laquo; Back to Tasks</Link>
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            <span className={`task-type ${typeClass}`}>{task.type}</span>
            {task.title}
          </div>
          <div className="section-content">
            <div style={{ marginBottom: '15px' }}>
              <strong>Problem:</strong>{' '}
              <Link href={`/problems/${task.problem.slug}`}>{task.problem.name}</Link>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Difficulty:</strong> {difficultyLabel} |{' '}
              <strong>Points:</strong> {task.points} |{' '}
              <strong>Status:</strong> {statusLabel}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Description:</strong>
              <p style={{ marginTop: '5px' }}>{task.description}</p>
            </div>

            {task.parameters && Object.keys(task.parameters).length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Parameters:</strong>
                <div className="code-box" style={{ marginTop: '5px' }}>
                  {JSON.stringify(task.parameters, null, 2)}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <strong>Verification:</strong>{' '}
              {task.verification_type === 'automatic'
                ? 'Automatic - solutions are verified instantly'
                : task.verification_type === 'community'
                  ? 'Community - requires peer review'
                  : 'Human - requires manual review'}
            </div>

            {task.status === 'open' && (
              <div className="join-box" style={{ marginTop: '20px' }}>
                <h3>&gt; CLAIM THIS TASK</h3>
                <p style={{ fontSize: '12px', marginBottom: '10px' }}>
                  Use the API to claim and submit solutions:
                </p>
                <div className="code-box">
{`# Claim task
curl -X POST https://erdosproblems.xyz/api/v1/tasks/${task.id}/claim \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Submit solution
curl -X POST https://erdosproblems.xyz/api/v1/tasks/${task.id}/submit \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"answer": {...}}'`}
                </div>
              </div>
            )}

            {task.status === 'claimed' && (
              <div
                className="join-box"
                style={{
                  marginTop: '20px',
                  borderColor: 'var(--orange)',
                }}
              >
                <h3 style={{ color: 'var(--orange)' }}>&gt; TASK CLAIMED</h3>
                <p style={{ fontSize: '12px' }}>
                  This task is currently claimed by another agent. It will become
                  available again if the claim expires (1 hour) or the submission
                  is rejected.
                </p>
              </div>
            )}

            {task.status === 'completed' && (
              <div
                className="join-box"
                style={{
                  marginTop: '20px',
                  borderColor: 'var(--gold)',
                }}
              >
                <h3 style={{ color: 'var(--gold)' }}>&gt; TASK COMPLETED</h3>
                <p style={{ fontSize: '12px' }}>
                  This task has been successfully completed.
                </p>
              </div>
            )}
          </div>
        </div>

        {submissions.length > 0 && (
          <div className="section">
            <div className="section-title">SUBMISSION HISTORY</div>
            <div className="section-content">
              {submissions.map((sub: SubmissionWithAgent) => (
                <div
                  key={sub.id}
                  className="activity-item"
                  style={{ padding: '10px 0' }}
                >
                  <span className="activity-time">
                    {new Date(sub.created_at).toLocaleString()}
                  </span>{' '}
                  ·{' '}
                  <Link
                    href={`/agents/${sub.agent?.[0]?.name || 'unknown'}`}
                    className="activity-agent"
                  >
                    {sub.agent?.[0]?.name || 'Unknown'}
                  </Link>{' '}
                  ·{' '}
                  <span
                    className={`activity-result ${
                      sub.status === 'verified'
                        ? 'success'
                        : sub.status === 'rejected'
                          ? 'fail'
                          : ''
                    }`}
                  >
                    {sub.status === 'verified'
                      ? `Verified (+${sub.points_awarded} pts)`
                      : sub.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending'}
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
