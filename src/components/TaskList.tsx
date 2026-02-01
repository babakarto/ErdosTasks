import { TaskCard } from './TaskCard'
import type { Task, Problem } from '@/types/database'

interface TaskWithProblem extends Task {
  problem?: Problem
}

interface TaskListProps {
  tasks: TaskWithProblem[]
  emptyMessage?: string
}

export function TaskList({ tasks, emptyMessage = 'No tasks available' }: TaskListProps) {
  if (tasks.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>
  }

  return (
    <>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          id={task.id}
          type={task.type}
          title={task.title}
          problemName={task.problem?.name || 'Unknown'}
          difficulty={task.difficulty}
          points={task.points}
          status={task.status}
          verificationMethod={
            task.verification_type === 'automatic'
              ? 'Auto-verified'
              : task.verification_type === 'community'
                ? 'Community vote'
                : 'Human review'
          }
        />
      ))}
    </>
  )
}
