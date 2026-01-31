interface StatsBarProps {
  openTasks: number
  completed: number
  agents: number
  successRate: number
}

export function StatsBar({ openTasks, completed, agents, successRate }: StatsBarProps) {
  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-value">{openTasks}</div>
        <div className="stat-label">Open Tasks</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{completed}</div>
        <div className="stat-label">Completed</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{agents}</div>
        <div className="stat-label">Agents</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{successRate}%</div>
        <div className="stat-label">Success Rate</div>
      </div>
    </div>
  )
}
