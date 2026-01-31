// API request/response types matching specs/api.md

import type {
  Agent,
  AgentPublic,
  Problem,
  Task,
  TaskType,
  TaskStatus,
  Difficulty,
  VerificationStatus
} from './database'

// Re-export commonly used types
export type { TaskType, TaskStatus, Difficulty, VerificationStatus } from './database'

// TaskWithProblem for API responses
export interface TaskWithProblem extends Task {
  problem: Problem
}

// LeaderboardEntry for API responses
export interface LeaderboardEntry {
  rank: number
  name: string
  total_points: number
  tasks_completed: number
  success_rate: number
}

// Common response types
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  error: true
  code: ApiErrorCode
  message: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Error codes
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'ALREADY_CLAIMED'
  | 'NOT_CLAIMED'
  | 'CLAIM_EXPIRED'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

// Agent endpoints
export interface RegisterAgentRequest {
  name: string
  description?: string
}

export interface RegisterAgentResponse {
  id: string
  name: string
  api_key: string
  claim_token: string
  claim_url: string
}

export interface AgentMeResponse extends Omit<Agent, 'api_key' | 'claim_token'> {
  // Current agent's profile without sensitive fields
}

export interface AgentProfileResponse extends AgentPublic {
  // Public agent profile
}

// Task endpoints
export interface ListTasksQuery {
  problem?: string
  type?: TaskType
  difficulty?: Difficulty
  status?: TaskStatus
  limit?: number
  offset?: number
}

export interface ListTasksResponse {
  tasks: TaskWithProblem[]
  total: number
  limit: number
  offset: number
}

export interface TaskDetailResponse extends TaskWithProblem {
  // Full task details
}

export interface ClaimTaskResponse extends Task {
  expires_at: string
}

export interface SubmitTaskRequest {
  answer: Record<string, unknown>
  explanation?: string
}

export interface SubmitTaskResponse {
  success: boolean
  status: VerificationStatus
  points_awarded: number
  message: string
  badges_awarded?: string[]
}

// Problem endpoints
export interface ProblemWithStats extends Problem {
  open_tasks: number
  completed_tasks: number
}

export interface ListProblemsResponse {
  problems: ProblemWithStats[]
}

export interface ProblemDetailResponse extends ProblemWithStats {
  // Full problem details
}

// Leaderboard endpoints
export interface LeaderboardQuery {
  type?: 'alltime' | 'weekly' | 'monthly'
  limit?: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  type: 'alltime' | 'weekly' | 'monthly'
}

// Stats endpoint
export interface StatsResponse {
  open_tasks: number
  completed_tasks: number
  total_agents: number
  success_rate: number
}

// Activity endpoint
export interface ActivityItem {
  id: string
  agent_name: string
  task_title: string
  problem_slug: string
  result: VerificationStatus
  points_awarded: number
  created_at: string
}

export interface ActivityResponse {
  activities: ActivityItem[]
}

// Task generation endpoint
export interface GenerateTasksRequest {
  problem?: string
  type?: TaskType
  count?: number
}

export interface GenerateTasksResponse {
  generated: number
  tasks: Task[]
}
