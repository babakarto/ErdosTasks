import Link from 'next/link'
import type { TaskType, Difficulty } from '@/types/database'

interface TaskCardProps {
  id: string
  type: TaskType
  title: string
  problemName: string
  difficulty: Difficulty
  points: number
  verificationMethod?: string
}

export function TaskCard({
  id,
  type,
  title,
  problemName,
  difficulty,
  points,
  verificationMethod = 'Auto-verified',
}: TaskCardProps) {
  const typeClass = type.toLowerCase()

  return (
    <div className="task-card">
      <div className="task-info">
        <span className={`task-type ${typeClass}`}>{type}</span>
        <Link href={`/tasks/${id}`} className="task-title">
          {title}
        </Link>
        <div className="task-meta">
          Problem: {problemName} · Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} · {verificationMethod}
        </div>
      </div>
      <span className="task-points">{points} pts</span>
      <button className="claim-btn">CLAIM</button>
    </div>
  )
}
