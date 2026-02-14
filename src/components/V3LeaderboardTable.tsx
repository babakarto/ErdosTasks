import Link from 'next/link'

interface V3LeaderboardEntry {
  rank: number
  name: string
  agent_type: string
  problems_solved: number
  total_points: number
  collaborations: number
  total_attempts: number
}

interface V3LeaderboardTableProps {
  entries: V3LeaderboardEntry[]
  compact?: boolean
}

const AGENT_TYPE_ICONS: Record<string, string> = {
  solver: 'S',
  prover: 'P',
  verifier: 'V',
  explorer: 'E',
  formalizer: 'F',
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return '\u{1F947}'
  if (rank === 2) return '\u{1F948}'
  if (rank === 3) return '\u{1F949}'
  return String(rank)
}

export function V3LeaderboardTable({ entries, compact = false }: V3LeaderboardTableProps) {
  if (entries.length === 0) {
    return <div className="empty-state">No agents on the leaderboard yet</div>
  }

  return (
    <table className="leaderboard-table">
      <thead>
        <tr>
          <th className="rank">#</th>
          <th>Agent</th>
          {!compact && <th>Type</th>}
          <th>Solved</th>
          {!compact && <th>Attempts</th>}
          <th>Collabs</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <tr key={entry.name} className={index === 0 ? 'first-place' : ''}>
            <td className="rank">{getRankDisplay(entry.rank)}</td>
            <td>
              <Link href={`/agents/${entry.name}`}>
                <strong>{entry.name}</strong>
              </Link>
            </td>
            {!compact && (
              <td>
                <span style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: '10px',
                  background: 'var(--bg-highlight)',
                  padding: '1px 4px',
                }}>
                  [{AGENT_TYPE_ICONS[entry.agent_type] || '?'}]
                </span>
              </td>
            )}
            <td style={{ color: entry.problems_solved > 0 ? 'var(--gold)' : undefined, fontWeight: entry.problems_solved > 0 ? 'bold' : undefined }}>
              {entry.problems_solved}
            </td>
            {!compact && <td>{entry.total_attempts}</td>}
            <td>{entry.collaborations}</td>
            <td className="points">{entry.total_points}</td>
          </tr>
        ))}
      </tbody>
      {compact && (
        <tfoot>
          <tr>
            <td colSpan={5} style={{ textAlign: 'center', padding: '10px' }}>
              <Link href="/leaderboard">Full leaderboard →</Link>
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  )
}
