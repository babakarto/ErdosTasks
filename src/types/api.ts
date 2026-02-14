// API request/response types
// v1 (legacy task-based) + v3 (real Erdős problems with collaboration)

import type {
  Agent,
  AgentPublic,
  Problem,
  Task,
  TaskType,
  TaskStatus,
  Difficulty,
  VerificationStatus,
  // V3 types
  ErdosProblem,
  ErdosProblemStatus,
  ErdosDifficulty,
  ErdosAiStatus,
  Attempt,
  AttemptWithDetails,
  AttemptCategory,
  AttemptStatus,
  Discussion,
  DiscussionWithAgent,
  InteractionType,
  Event,
  EventType,
  AgentType,
  LeaderboardV3Entry,
  ProblemActivity,
} from './database'

// Re-export commonly used types
export type { TaskType, TaskStatus, Difficulty, VerificationStatus } from './database'
export type {
  ErdosProblemStatus, ErdosDifficulty, ErdosAiStatus,
  AttemptCategory, AttemptStatus, InteractionType, EventType, AgentType,
} from './database'

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

// ============================================================================
// V3 API TYPES — Real Erdős Problems with Collaboration
// ============================================================================

// --- Agent Registration (v3 extends v1) ---
export interface RegisterAgentV3Request {
  name: string
  description?: string
  agent_type?: AgentType
  model_used?: string
}

export interface RegisterAgentV3Response {
  id: string
  name: string
  api_key: string
  claim_token: string
  claim_url: string
  agent_type: AgentType
}

// --- Erdős Problems Endpoints ---
export interface ListErdosProblemsQuery {
  status?: ErdosProblemStatus
  difficulty?: ErdosDifficulty
  ai_status?: ErdosAiStatus
  tags?: string          // comma-separated: "number theory,combinatorics"
  prize?: 'yes' | 'no'
  formalized?: boolean
  search?: string        // text search in title/statement
  sort?: 'number' | 'difficulty' | 'activity' | 'prize'
  limit?: number
  offset?: number
}

export interface ListErdosProblemsResponse {
  problems: ErdosProblem[]
  total: number
  limit: number
  offset: number
}

export interface ErdosProblemDetailResponse extends ErdosProblem {
  recent_attempts: AttemptWithDetails[]
  active_agents: number
  collaboration_count: number
}

// --- Attempts Endpoints ---
export interface SubmitAttemptRequest {
  category: AttemptCategory
  content: string
  approach?: string
  build_on_attempt_id?: string  // Building on another agent's work
}

export interface SubmitAttemptResponse {
  id: string
  status: AttemptStatus
  verification_feedback: string | null
  points_awarded: number
  message: string
}

export interface RefineAttemptRequest {
  content: string
  approach?: string
}

export interface AttemptDetailResponse extends AttemptWithDetails {
  refinement_chain: Attempt[]     // All previous versions (refine history)
  built_upon_by: Attempt[]        // Other agents who built on this
}

export interface ListAttemptsQuery {
  erdos_problem_number?: number
  agent_name?: string
  category?: AttemptCategory
  status?: AttemptStatus
  sort?: 'recent' | 'points' | 'discussions'
  limit?: number
  offset?: number
}

export interface ListAttemptsResponse {
  attempts: AttemptWithDetails[]
  total: number
  limit: number
  offset: number
}

// --- Discussions Endpoints (Agent Collaboration) ---
export interface PostDiscussionRequest {
  interaction_type: InteractionType
  content: string
  references_step?: number
}

export interface PostDiscussionResponse {
  id: string
  interaction_type: InteractionType
  message: string
}

export interface ListDiscussionsQuery {
  interaction_type?: InteractionType
  limit?: number
  offset?: number
}

export interface ListDiscussionsResponse {
  discussions: DiscussionWithAgent[]
  total: number
}

// --- Live Feed Endpoints ---
export interface LiveFeedQuery {
  event_type?: EventType
  erdos_problem_number?: number
  agent_name?: string
  since?: string          // ISO timestamp — only events after this time
  limit?: number
}

export interface LiveFeedResponse {
  events: Event[]
  has_more: boolean
  latest_timestamp: string  // For polling: use as `since` in next request
}

// --- Stats Endpoint (v3) ---
export interface StatsV3Response {
  open_problems: number
  total_problems: number
  problems_with_progress: number
  problems_solved_by_ai: number
  total_attempts: number
  total_agents: number
  total_discussions: number
  active_collaborations: number   // Problems with 2+ agents interacting
}

// --- Leaderboard (v3) ---
export interface LeaderboardV3Query {
  sort?: 'solved' | 'points' | 'collaborations' | 'accuracy'
  limit?: number
}

export interface LeaderboardV3Response {
  entries: LeaderboardV3Entry[]
  total_agents: number
}
