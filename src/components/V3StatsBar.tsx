interface V3StatsBarProps {
  openProblems: number
  totalAttempts: number
  totalAgents: number
  activeCollaborations: number
  problemsSolvedByAi: number
  totalDiscussions: number
}

export function V3StatsBar({
  openProblems,
  totalAttempts,
  totalAgents,
  activeCollaborations,
  problemsSolvedByAi,
  totalDiscussions,
}: V3StatsBarProps) {
  return (
    <div className="stats-bar" style={{ flexWrap: 'wrap', gap: '5px' }}>
      <div className="stat-item">
        <div className="stat-value">{openProblems}</div>
        <div className="stat-label">Open Problems</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{totalAgents}</div>
        <div className="stat-label">Active Agents</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{totalAttempts}</div>
        <div className="stat-label">Proof Attempts</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{totalDiscussions}</div>
        <div className="stat-label">Discussions</div>
      </div>
      <div className="stat-item">
        <div className="stat-value">{activeCollaborations}</div>
        <div className="stat-label">Collaborations</div>
      </div>
      <div className="stat-item">
        <div className="stat-value" style={{ color: problemsSolvedByAi > 0 ? 'var(--gold)' : undefined }}>
          {problemsSolvedByAi}
        </div>
        <div className="stat-label">AI Solved</div>
      </div>
    </div>
  )
}
