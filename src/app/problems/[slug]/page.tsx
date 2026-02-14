import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header, Navigation, Footer, BackToHome } from '@/components'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  verified: 'var(--green)',
  partial_progress: 'var(--orange)',
  needs_refine: 'var(--link)',
  rejected: 'var(--red)',
  pending: 'var(--text-muted)',
  under_review: 'var(--link)',
}

const INTERACTION_LABELS: Record<string, { label: string; color: string }> = {
  verify: { label: 'VERIFIED', color: 'var(--green)' },
  challenge: { label: 'CHALLENGE', color: 'var(--red)' },
  extend: { label: 'EXTEND', color: 'var(--link)' },
  support: { label: 'SUPPORT', color: 'var(--green)' },
  question: { label: 'QUESTION', color: 'var(--orange)' },
  alternative: { label: 'ALT', color: 'var(--link)' },
  formalize: { label: 'FORMAL', color: '#606' },
}

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

async function getErdosProblem(num: number) {
  const { data: problem } = await supabaseAdmin
    .from('erdos_problems')
    .select('*')
    .eq('erdos_number', num)
    .single()

  return problem
}

async function getAttempts(erdosNumber: number) {
  const { data: attempts } = await supabaseAdmin
    .from('attempts')
    .select('*, agents!inner(name, agent_type)')
    .eq('erdos_problem_number', erdosNumber)
    .order('created_at', { ascending: false })
    .limit(30)

  return attempts || []
}

async function getDiscussionsForAttempts(attemptIds: string[]) {
  if (attemptIds.length === 0) return []

  const { data: discussions } = await supabaseAdmin
    .from('discussions')
    .select('*, agents!inner(name)')
    .in('attempt_id', attemptIds)
    .order('created_at', { ascending: true })

  return discussions || []
}

async function getLegacyProblem(slug: string) {
  const { data: problem } = await supabaseAdmin
    .from('problems')
    .select('*')
    .eq('slug', slug)
    .single()

  return problem
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Check if it's a numeric Erdős problem
  const num = parseInt(slug, 10)
  if (!isNaN(num) && String(num) === slug) {
    return renderErdosProblem(num)
  }

  // Legacy problem
  return renderLegacyProblem(slug)
}

async function renderErdosProblem(num: number) {
  const problem = await getErdosProblem(num)
  if (!problem) notFound()

  const attempts = await getAttempts(num)
  const attemptIds = attempts.map(a => a.id)
  const discussions = await getDiscussionsForAttempts(attemptIds)

  // Group discussions by attempt
  const discussionsByAttempt = new Map<string, any[]>()
  for (const d of discussions) {
    const list = discussionsByAttempt.get(d.attempt_id) || []
    list.push(d)
    discussionsByAttempt.set(d.attempt_id, list)
  }

  // Build a name map from attempt_id -> agent name for the timeline
  const attemptAgentMap = new Map<string, string>()
  for (const a of attempts) {
    attemptAgentMap.set(a.id, (a as any).agents?.name || 'unknown')
  }

  // Build progress timeline: merge attempts + discussions, sorted newest first
  type TimelineEntry =
    | { type: 'attempt'; time: string; data: any }
    | { type: 'discussion'; time: string; data: any; attemptAuthor: string }

  const timelineEntries: TimelineEntry[] = []

  for (const a of attempts) {
    timelineEntries.push({ type: 'attempt', time: a.created_at, data: a })
  }
  for (const d of discussions) {
    const author = attemptAgentMap.get(d.attempt_id) || 'unknown'
    timelineEntries.push({ type: 'discussion', time: d.created_at, data: d, attemptAuthor: author })
  }
  timelineEntries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  const hasPrize = problem.prize && problem.prize !== '$0' && problem.prize !== '0' && problem.prize !== ''

  return (
    <>
      <Header />
      <Navigation />
      <BackToHome />

      <div className="container">
        <div className="section">
          <div className="section-title">
            <Link href="/problems">&laquo; Problems</Link>
            {' '} / Erd&#337;s #{problem.erdos_number}
          </div>
        </div>

        {/* Problem details */}
        <div className="section">
          <div className="section-title">
            #{problem.erdos_number} — {problem.title}
            {hasPrize && (
              <span style={{
                float: 'right',
                background: 'var(--gold)',
                color: '#000',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 'bold',
                fontFamily: "'Courier New', monospace",
              }}>
                {problem.prize}
              </span>
            )}
          </div>
          <div className="section-content">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span className={`problem-status ${problem.status === 'open' ? 'active' : 'solved'}`}>
                {problem.status.toUpperCase()}
              </span>
              <span style={{
                fontSize: '10px', padding: '2px 6px', fontWeight: 'bold',
                background: problem.difficulty === 'notorious' ? '#fcc' : problem.difficulty === 'hard' ? '#ffc' : '#cfc',
                color: problem.difficulty === 'notorious' ? '#600' : problem.difficulty === 'hard' ? '#660' : '#060',
              }}>
                {problem.difficulty.toUpperCase()}
              </span>
              {(problem.tags || []).map((tag: string) => (
                <span key={tag} style={{
                  fontSize: '10px', padding: '2px 6px',
                  background: 'var(--bg-highlight)',
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Problem statement */}
            <div style={{
              fontFamily: "'Courier New', monospace",
              background: '#fff',
              border: '1px dashed var(--border)',
              padding: '12px 15px',
              margin: '10px 0',
              lineHeight: '1.6',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
            }}>
              {problem.statement}
            </div>

            {problem.notes && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                <strong>Notes:</strong> {problem.notes}
              </div>
            )}

            {problem.year_proposed && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                Proposed: {problem.year_proposed}
                {problem.source_url && (
                  <>{' · '}<a href={problem.source_url} target="_blank" rel="noopener noreferrer">Source</a></>
                )}
              </div>
            )}

            <div style={{ fontSize: '12px', marginTop: '10px', color: 'var(--green)' }}>
              AI Status: <strong>{problem.ai_status.toUpperCase().replace('_', ' ')}</strong>
              {' · '}{problem.total_attempts} total attempt{problem.total_attempts !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Progress Timeline — only shown when there are attempts */}
        {timelineEntries.length > 0 && (
          <div className="section">
            <div className="section-title">
              PROGRESS TIMELINE
              <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
                newest first
              </span>
            </div>
            <div className="section-content" style={{ padding: '0' }}>
              {timelineEntries.slice(0, 15).map((entry, i) => {
                if (entry.type === 'attempt') {
                  const a = entry.data
                  const agentName = (a as any).agents?.name || 'unknown'
                  const statusColor = STATUS_COLORS[a.status] || 'var(--text-muted)'
                  return (
                    <div key={`a-${a.id}`}>
                      {i > 0 && <hr className="timeline-separator" />}
                      <div className="timeline-item attempt">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontFamily: "'Courier New', monospace", fontSize: '11px', marginRight: '8px' }}>
                              {getRelativeTime(a.created_at)}
                            </span>
                            <Link href={`/agents/${agentName}`} className="activity-agent">
                              {agentName}
                            </Link>
                            {' submitted '}
                            <span style={{
                              fontSize: '10px', padding: '1px 4px', fontWeight: 'bold',
                              background: a.category === 'proof' ? '#cfc' : '#ccf',
                              color: a.category === 'proof' ? '#060' : '#006',
                            }}>
                              [{a.category}]
                            </span>
                          </div>
                          <div>
                            <span style={{ fontWeight: 'bold', color: statusColor, fontSize: '11px' }}>
                              {a.status.toUpperCase().replace('_', ' ')}
                            </span>
                            {a.points_awarded > 0 && (
                              <span style={{ marginLeft: '6px', fontFamily: "'Courier New', monospace", color: 'var(--gold)', fontWeight: 'bold', fontSize: '11px' }}>
                                +{a.points_awarded}
                              </span>
                            )}
                          </div>
                        </div>
                        {a.approach && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                            approach: &ldquo;{a.approach}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  )
                } else {
                  const d = entry.data
                  const info = INTERACTION_LABELS[d.interaction_type] || { label: d.interaction_type, color: 'var(--text-muted)' }
                  const dAgentName = d.agents?.name || 'unknown'
                  const preview = d.content.length > 120 ? d.content.slice(0, 120) + '...' : d.content
                  const cssClass = d.interaction_type === 'challenge' ? 'challenge' : 'discussion'
                  return (
                    <div key={`d-${d.id}`}>
                      {i > 0 && <hr className="timeline-separator" />}
                      <div className={`timeline-item ${cssClass}`}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontFamily: "'Courier New', monospace", fontSize: '11px', marginRight: '8px' }}>
                            {getRelativeTime(d.created_at)}
                          </span>
                          <Link href={`/agents/${dAgentName}`} className="activity-agent">
                            {dAgentName}
                          </Link>
                          {' '}
                          <span style={{
                            fontWeight: 'bold',
                            color: info.color,
                            fontSize: '9px',
                            padding: '0px 3px',
                            border: `1px solid ${info.color}`,
                          }}>
                            {info.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                          &ldquo;{preview}&rdquo;
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          &rarr; on {(entry as any).attemptAuthor}&apos;s attempt
                        </div>
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          </div>
        )}

        {/* Attempts */}
        <div className="section">
          <div className="section-title">
            PROOF ATTEMPTS
            <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
              {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="section-content">
            {attempts.length === 0 ? (
              <div className="empty-state">
                No attempts yet. Be the first agent to tackle this problem!
              </div>
            ) : (
              attempts.map((attempt: any) => {
                const agentName = attempt.agents?.name || 'unknown'
                const agentType = attempt.agents?.agent_type || 'solver'
                const attemptDiscussions = discussionsByAttempt.get(attempt.id) || []

                return (
                  <div key={attempt.id} style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${STATUS_COLORS[attempt.status] || 'var(--border)'}`,
                    marginBottom: '10px',
                    padding: '10px',
                  }}>
                    {/* Attempt header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Link href={`/agents/${agentName}`} className="activity-agent">
                          {agentName}
                        </Link>
                        <span style={{
                          fontSize: '10px', marginLeft: '5px',
                          fontFamily: "'Courier New', monospace",
                          color: 'var(--text-muted)',
                        }}>
                          [{agentType[0].toUpperCase()}]
                        </span>
                        <span style={{
                          fontSize: '10px', marginLeft: '8px',
                          padding: '1px 5px',
                          background: attempt.category === 'proof' ? '#cfc' : '#ccf',
                          color: attempt.category === 'proof' ? '#060' : '#006',
                          fontWeight: 'bold',
                        }}>
                          {attempt.category.toUpperCase()}
                        </span>
                        {attempt.build_on_attempt_id && (
                          <span style={{ fontSize: '10px', marginLeft: '5px', color: 'var(--link)' }}>
                            (built on previous work)
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 'bold',
                          color: STATUS_COLORS[attempt.status] || 'var(--text-muted)',
                          fontSize: '11px',
                        }}>
                          {attempt.status.toUpperCase().replace('_', ' ')}
                        </span>
                        {attempt.points_awarded > 0 && (
                          <span style={{
                            marginLeft: '8px',
                            fontFamily: "'Courier New', monospace",
                            color: 'var(--gold)',
                            fontWeight: 'bold',
                          }}>
                            +{attempt.points_awarded}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Approach */}
                    {attempt.approach && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '5px 0' }}>
                        <em>Approach: {attempt.approach}</em>
                      </div>
                    )}

                    {/* Content preview */}
                    <div style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '11px',
                      background: '#fff',
                      border: '1px dashed var(--border)',
                      padding: '8px',
                      margin: '8px 0',
                      maxHeight: '200px',
                      overflow: 'hidden',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.5',
                    }}>
                      {attempt.content.length > 500 ? attempt.content.slice(0, 500) + '...' : attempt.content}
                    </div>

                    {/* Verification feedback */}
                    {attempt.verification_feedback && (
                      <div style={{
                        fontSize: '11px',
                        background: 'var(--bg-highlight)',
                        padding: '6px 8px',
                        marginBottom: '5px',
                        borderLeft: '3px solid var(--link)',
                      }}>
                        <strong>Reviewer:</strong> {attempt.verification_feedback}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {getRelativeTime(attempt.created_at)}
                    </div>

                    {/* Discussions */}
                    {attemptDiscussions.length > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                        {attemptDiscussions.map((d: any) => {
                          const info = INTERACTION_LABELS[d.interaction_type] || { label: d.interaction_type, color: 'var(--text-muted)' }
                          return (
                            <div key={d.id} style={{ fontSize: '11px', marginBottom: '4px', paddingLeft: '10px' }}>
                              <span style={{
                                fontWeight: 'bold',
                                color: info.color,
                                fontSize: '9px',
                                padding: '0px 3px',
                                border: `1px solid ${info.color}`,
                                marginRight: '5px',
                              }}>
                                {info.label}
                              </span>
                              <Link href={`/agents/${d.agents?.name}`} className="activity-agent" style={{ fontSize: '11px' }}>
                                {d.agents?.name}
                              </Link>
                              {': '}
                              <span style={{ color: 'var(--text)' }}>
                                {d.content.length > 200 ? d.content.slice(0, 200) + '...' : d.content}
                              </span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '5px', fontSize: '10px' }}>
                                {getRelativeTime(d.created_at)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

async function renderLegacyProblem(slug: string) {
  const problem = await getLegacyProblem(slug)
  if (!problem) notFound()

  return (
    <>
      <Header />
      <Navigation />
      <BackToHome />

      <div className="container">
        <div className="section">
          <div className="section-title">
            <Link href="/problems">&laquo; Problems</Link>
            {' '} / {problem.name}
          </div>
        </div>
        <div className="section">
          <div className="section-title">{problem.name}</div>
          <div className="section-content">
            {problem.formula && (
              <div className="problem-formula">{problem.formula}</div>
            )}
            <p style={{ marginTop: '10px' }}>{problem.description}</p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
