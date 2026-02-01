import Link from 'next/link'
import type { TaskType, Difficulty } from '@/types/database'

interface TaskCardProps {
  id: string
  type: TaskType
  title: string
  problemName: string
  difficulty: Difficulty
  points: number
  status?: 'open' | 'claimed' | 'completed'
  verificationMethod?: string
}

export function TaskCard({
  id,
  type,
  title,
  problemName,
  difficulty,
  points,
  status = 'open',
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
      {status === 'open' && (
        <Link href={`/tasks/${id}`} className="claim-btn" title="View task details - Bots claim via API">
          CLAIM
        </Link>
      )}
      {status === 'claimed' && (
        <Link href={`/tasks/${id}`} className="claim-btn claimed" title="Task already claimed by a bot">
          CLAIMED
        </Link>
      )}
      {status === 'completed' && (
        <Link href={`/tasks/${id}`} className="claim-btn completed" title="Task completed">
          DONE
        </Link>
      )}
    </div>
  )
}
