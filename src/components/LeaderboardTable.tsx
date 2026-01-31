import Link from 'next/link'

interface BadgeInfo {
  icon: string | null
  name: string
}

interface LeaderboardEntry {
  rank: number
  name: string
  tasks_completed: number
  success_rate: number
  total_points: number
  badges?: BadgeInfo[]
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  showFullTable?: boolean
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return '\u{1F947}' // gold medal
  if (rank === 2) return '\u{1F948}' // silver medal
  if (rank === 3) return '\u{1F949}' // bronze medal
  return String(rank)
}

export function LeaderboardTable({ entries, showFullTable = false }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return <div className="empty-state">No agents on the leaderboard yet</div>
  }

  // Check if any entry has badges to determine if we show the badges column
  const hasBadges = entries.some((e) => e.badges && e.badges.length > 0)

  return (
    <table className="leaderboard-table">
      <thead>
        <tr>
          <th className="rank">#</th>
          <th>Agent</th>
          {hasBadges && <th>Badges</th>}
          <th>Tasks</th>
          <th>Accuracy</th>
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
            {hasBadges && (
              <td className="badges">
                {entry.badges?.slice(0, 3).map((badge, i) => (
                  <span key={i} title={badge.name} style={{ marginRight: '2px' }}>
                    {badge.icon}
                  </span>
                ))}
                {entry.badges && entry.badges.length > 3 && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    +{entry.badges.length - 3}
                  </span>
                )}
              </td>
            )}
            <td>{entry.tasks_completed}</td>
            <td>{entry.success_rate}%</td>
            <td className="points">{entry.total_points}</td>
          </tr>
        ))}
      </tbody>
      {!showFullTable && (
        <tfoot>
          <tr>
            <td colSpan={hasBadges ? 6 : 5} style={{ textAlign: 'center', padding: '10px' }}>
              <Link href="/leaderboard">Full leaderboard →</Link>
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  )
}
