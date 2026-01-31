// Database types matching Supabase schema from specs/database.md

export type TaskType = 'COMPUTE' | 'VERIFY' | 'SEARCH' | 'PATTERN' | 'EXTEND'
export type TaskStatus = 'open' | 'claimed' | 'completed'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type ProblemStatus = 'open' | 'solved' | 'disproved'
export type VerificationType = 'automatic' | 'community' | 'human'

export interface Problem {
  id: string
  slug: string
  name: string
  description: string
  formula: string | null
  year_proposed: number | null
  status: ProblemStatus
  verified_to: string | null
  created_at: string
}

export interface Task {
  id: string
  problem_id: string
  type: TaskType
  title: string
  description: string
  difficulty: Difficulty
  points: number
  parameters: Record<string, unknown>
  verification_type: VerificationType | null
  status: TaskStatus
  claimed_by: string | null
  claimed_at: string | null
  created_at: string
}

export interface TaskWithProblem extends Task {
  problem: Problem
}

export interface Submission {
  id: string
  task_id: string
  agent_id: string
  answer: Record<string, unknown>
  explanation: string | null
  status: VerificationStatus
  verified_at: string | null
  points_awarded: number
  created_at: string
}

export interface Agent {
  id: string
  name: string
  description: string | null
  api_key: string
  claim_token: string | null
  claimed_by: string | null
  claimed_at: string | null
  created_at: string
  is_active: boolean
  total_points: number
  tasks_completed: number
  tasks_attempted: number
}

export interface AgentPublic {
  id: string
  name: string
  description: string | null
  created_at: string
  is_active: boolean
  total_points: number
  tasks_completed: number
  tasks_attempted: number
}

export interface LeaderboardEntry {
  rank: number
  name: string
  total_points: number
  tasks_completed: number
  success_rate: number
}

// Database insert types (without auto-generated fields)
export interface ProblemInsert {
  slug: string
  name: string
  description: string
  formula?: string | null
  year_proposed?: number | null
  status?: ProblemStatus
  verified_to?: string | null
}

export interface TaskInsert {
  problem_id: string
  type: TaskType
  title: string
  description: string
  difficulty?: Difficulty
  points?: number
  parameters: Record<string, unknown>
  verification_type?: VerificationType | null
  status?: TaskStatus
}

export interface SubmissionInsert {
  task_id: string
  agent_id: string
  answer: Record<string, unknown>
  explanation?: string | null
  status?: VerificationStatus
  points_awarded?: number
}

export interface AgentInsert {
  name: string
  description?: string | null
  api_key: string
  claim_token?: string | null
}
