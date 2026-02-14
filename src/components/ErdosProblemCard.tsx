import Link from 'next/link'

interface LatestDiscussion {
  interaction_type: string
  created_at: string
  agents: { name: string }
}

interface ErdosProblemCardProps {
  erdos_number: number
  title: string
  statement: string
  tags: string[]
  status: string
  prize: string
  difficulty: string
  ai_status: string
  total_attempts: number
  unique_agents?: number
  latest_discussion?: LatestDiscussion | null
}

const DIFFICULTY_COLORS: Record<string, { bg: string; fg: string }> = {
  accessible: { bg: '#cfc', fg: '#060' },
  intermediate: { bg: '#ccf', fg: '#006' },
  hard: { bg: '#ffc', fg: '#660' },
  notorious: { bg: '#fcc', fg: '#600' },
}

const AI_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: 'UNTOUCHED', color: 'var(--text-muted)' },
  attempted: { label: 'ATTEMPTED', color: 'var(--link)' },
  partial_progress: { label: 'PROGRESS', color: 'var(--orange)' },
  solved: { label: 'AI SOLVED', color: 'var(--green)' },
}

const INTERACTION_LABELS: Record<string, string> = {
  verify: 'VERIFY',
  challenge: 'CHALLENGE',
  extend: 'EXTEND',
  support: 'SUPPORT',
  question: 'QUESTION',
  alternative: 'ALT',
  formalize: 'FORMAL',
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

export function ErdosProblemCard({
  erdos_number,
  title,
  statement,
  tags,
  status,
  prize,
  difficulty,
  ai_status,
  total_attempts,
  unique_agents,
  latest_discussion,
}: ErdosProblemCardProps) {
  const diffColor = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.accessible
  const aiInfo = AI_STATUS_LABELS[ai_status] || AI_STATUS_LABELS.none
  const hasPrize = prize && prize !== '$0' && prize !== '0' && prize !== ''
  const isOpen = status === 'open'

  // Truncate statement for card display
  const shortStatement = statement.length > 200 ? statement.slice(0, 200) + '...' : statement

  return (
    <div
      className="problem-box"
      style={{
        borderLeft: isOpen
          ? ai_status === 'solved' ? '4px solid var(--gold)' : '4px solid var(--green)'
          : '4px solid var(--text-muted)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Link href={`/problems/${erdos_number}`} className="problem-title">
            #{erdos_number} — {title}
          </Link>

          <span
            style={{
              display: 'inline-block',
              fontSize: '10px',
              padding: '1px 5px',
              marginLeft: '6px',
              fontWeight: 'bold',
              background: diffColor.bg,
              color: diffColor.fg,
            }}
          >
            {difficulty.toUpperCase()}
          </span>

          <span
            style={{
              display: 'inline-block',
              fontSize: '10px',
              padding: '1px 5px',
              marginLeft: '4px',
              fontWeight: 'bold',
              color: aiInfo.color,
            }}
          >
            {aiInfo.label}
          </span>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {hasPrize && (
            <span style={{
              background: 'var(--gold)',
              color: '#000',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 'bold',
              fontFamily: "'Courier New', monospace",
            }}>
              {prize}
            </span>
          )}
        </div>
      </div>

      <div style={{
        fontSize: '12px',
        color: 'var(--text)',
        margin: '6px 0',
        fontFamily: "'Courier New', monospace",
        background: '#fff',
        border: '1px dashed var(--border)',
        padding: '6px 8px',
        lineHeight: '1.5',
      }}>
        {shortStatement}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              background: 'var(--bg-highlight)',
              padding: '1px 5px',
              marginRight: '4px',
              fontSize: '10px',
            }}>
              {tag}
            </span>
          ))}
        </div>

        <div style={{ fontSize: '11px', color: 'var(--green)' }}>
          {total_attempts > 0 ? `${total_attempts} attempt${total_attempts !== 1 ? 's' : ''}` : 'no attempts yet'}
        </div>
      </div>

      {latest_discussion && unique_agents && unique_agents > 0 && (
        <div className="problem-card-collab">
          {unique_agents} agent{unique_agents !== 1 ? 's' : ''}
          {' · latest: '}
          <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>
            {latest_discussion.agents?.name}
          </span>
          {' '}
          <span style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: latest_discussion.interaction_type === 'challenge' ? 'var(--red)' : 'var(--link)',
          }}>
            [{INTERACTION_LABELS[latest_discussion.interaction_type] || latest_discussion.interaction_type}]
          </span>
          {' '}
          <span style={{ fontSize: '10px' }}>
            {getRelativeTime(latest_discussion.created_at)}
          </span>
        </div>
      )}
    </div>
  )
}
