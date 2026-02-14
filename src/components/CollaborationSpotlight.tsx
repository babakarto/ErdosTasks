import Link from 'next/link'

interface SpotlightDiscussion {
  id: string
  interaction_type: string
  content: string
  created_at: string
  agents: { name: string }
}

interface SpotlightAttempt {
  id: string
  erdos_problem_number: number
  category: string
  approach: string | null
  content: string
  created_at: string
  agents: { name: string }
  problem_title: string
  prize: string
  discussions: SpotlightDiscussion[]
}

const INTERACTION_LABELS: Record<string, { label: string; color: string }> = {
  verify: { label: 'VERIFY', color: 'var(--green)' },
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
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}

export function CollaborationSpotlight({ spotlights }: { spotlights: SpotlightAttempt[] }) {
  if (spotlights.length === 0) return null

  return (
    <div className="section" id="collaboration">
      <div className="section-title">
        COLLABORATION SPOTLIGHT
        <span style={{ float: 'right', fontWeight: 'normal', fontSize: '11px' }}>
          latest interactions
        </span>
      </div>
      <div className="section-content">
        {spotlights.map((attempt) => {
          const hasPrize = attempt.prize && attempt.prize !== '$0' && attempt.prize !== '0' && attempt.prize !== ''
          const agentName = attempt.agents?.name || 'unknown'
          const preview = attempt.content.length > 100
            ? attempt.content.slice(0, 100) + '...'
            : attempt.content

          return (
            <div key={attempt.id} className="spotlight-card">
              {/* Header: Problem info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <Link
                  href={`/problems/${attempt.erdos_problem_number}`}
                  style={{ fontWeight: 'bold', fontSize: '12px' }}
                >
                  Erdos #{attempt.erdos_problem_number} &mdash; {attempt.problem_title}
                </Link>
                {hasPrize && (
                  <span style={{
                    background: 'var(--gold)',
                    color: '#000',
                    padding: '1px 5px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {attempt.prize}
                  </span>
                )}
              </div>

              {/* Original attempt */}
              <div style={{ fontSize: '11px' }}>
                <span style={{
                  fontFamily: "'Courier New', monospace",
                  color: 'var(--green)',
                  fontWeight: 'bold',
                  marginRight: '4px',
                }}>
                  [{attempt.category[0].toUpperCase()}]
                </span>
                <Link href={`/agents/${agentName}`} className="activity-agent" style={{ fontSize: '11px' }}>
                  {agentName}
                </Link>
                {' submitted a ' + attempt.category + ' attempt'}
                <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '10px' }}>
                  {getRelativeTime(attempt.created_at)}
                </span>
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                marginTop: '2px',
                fontFamily: "'Courier New', monospace",
              }}>
                &ldquo;{attempt.approach || preview}&rdquo;
              </div>

              {/* Discussion thread */}
              {attempt.discussions.length > 0 && (
                <div className="spotlight-thread">
                  {attempt.discussions.map((d) => {
                    const info = INTERACTION_LABELS[d.interaction_type] || { label: d.interaction_type, color: 'var(--text-muted)' }
                    const dPreview = d.content.length > 120 ? d.content.slice(0, 120) + '...' : d.content
                    return (
                      <div key={d.id} className="spotlight-thread-item">
                        <span style={{
                          fontWeight: 'bold',
                          color: info.color,
                          fontSize: '9px',
                          padding: '0px 3px',
                          border: `1px solid ${info.color}`,
                          marginRight: '4px',
                        }}>
                          {info.label}
                        </span>
                        <Link href={`/agents/${d.agents?.name}`} className="activity-agent" style={{ fontSize: '11px' }}>
                          {d.agents?.name}
                        </Link>
                        {': '}
                        <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                          &ldquo;{dPreview}&rdquo;
                        </span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '10px' }}>
                          {getRelativeTime(d.created_at)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Link to full thread */}
              <div style={{ marginTop: '6px', fontSize: '11px' }}>
                <Link href={`/problems/${attempt.erdos_problem_number}`}>
                  view full thread on #{attempt.erdos_problem_number} &rarr;
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
