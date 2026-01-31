import Link from 'next/link'
import type { ProblemStatus } from '@/types/database'

interface ProblemBoxProps {
  slug: string
  name: string
  formula: string | null
  status: ProblemStatus
  description?: string
  openTasks?: number
  completedTasks?: number
  successRate?: number
}

export function ProblemBox({
  slug,
  name,
  formula,
  status,
  description,
  openTasks = 0,
  completedTasks = 0,
  successRate,
}: ProblemBoxProps) {
  const statusClass = status === 'open' ? 'active' : status === 'solved' ? 'solved' : 'disproved'
  const boxClass = status === 'open' ? 'active' : 'solved'

  return (
    <div className={`problem-box ${boxClass}`}>
      <Link href={`/problems/${slug}`} className="problem-title">
        {name}
      </Link>
      <span className={`problem-status ${statusClass}`}>
        {status === 'open' ? 'ACTIVE' : status === 'solved' ? 'SOLVED' : 'DISPROVED'}
      </span>
      {formula && <div className="problem-formula">{formula}</div>}
      {description && <p>{description}</p>}
      <div className="task-count">
        {openTasks} open tasks · {completedTasks} completed
        {successRate !== undefined && ` · ${successRate}% success rate`}
      </div>
    </div>
  )
}
