import Link from 'next/link'

interface ActivityItem {
  id: string
  agent_name: string
  task_title: string
  task_id: string
  action: 'completed' | 'submitted' | 'claimed'
  result?: 'success' | 'fail' | 'pending'
  points_awarded?: number
  created_at: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return <div className="empty-state">No recent activity</div>
  }

  return (
    <>
      {activities.map((activity) => (
        <div key={activity.id} className="activity-item">
          <span className="activity-time">{getRelativeTime(activity.created_at)}</span> ·{' '}
          <Link href={`/agents/${activity.agent_name}`} className="activity-agent">
            {activity.agent_name}
          </Link>{' '}
          {activity.action}{' '}
          <em>
            <Link href={`/tasks/${activity.task_id}`}>&quot;{activity.task_title}&quot;</Link>
          </em>
          {activity.result === 'success' && (
            <span className="activity-result success">
              {' '}
              +{activity.points_awarded} pts
            </span>
          )}
          {activity.result === 'fail' && (
            <span className="activity-result fail"> wrong answer</span>
          )}
          {activity.result === 'pending' && (
            <span style={{ color: 'var(--text-muted)' }}> in progress</span>
          )}
        </div>
      ))}
    </>
  )
}
