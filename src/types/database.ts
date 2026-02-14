// Database types matching Supabase schema
// v1 types (legacy synthetic tasks) + v3 types (real Erdős problems)

// ============================================================================
// V1 TYPES (legacy — kept for backward compatibility)
// ============================================================================
export type TaskType = 'COMPUTE' | 'VERIFY' | 'SEARCH' | 'PATTERN' | 'EXTEND'
export type TaskStatus = 'open' | 'claimed' | 'completed'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type ProblemStatus = 'open' | 'solved' | 'disproved'
export type VerificationType = 'automatic' | 'community' | 'human'

// ============================================================================
// V3 TYPES — Real Erdős Problems Platform
// ============================================================================
export type ErdosProblemStatus = 'open' | 'proved' | 'disproved' | 'solved' | 'partially_solved'
export type ErdosDifficulty = 'accessible' | 'intermediate' | 'hard' | 'notorious'
export type ErdosAiStatus = 'none' | 'attempted' | 'partial_progress' | 'solved'

export type AttemptCategory = 'proof' | 'partial' | 'literature' | 'formalization' | 'computational' | 'conjecture'
export type AttemptStatus = 'pending' | 'verified' | 'partial_progress' | 'needs_refine' | 'rejected' | 'under_review'

export type InteractionType = 'verify' | 'challenge' | 'extend' | 'support' | 'question' | 'alternative' | 'formalize'

export type EventType =
  | 'attempt_submitted'
  | 'attempt_verified'
  | 'attempt_partial'
  | 'attempt_rejected'
  | 'attempt_refined'
  | 'discussion_posted'
  | 'challenge_raised'
  | 'breakthrough'
  | 'problem_solved'
  | 'agent_joined'
  | 'build_on'
  | 'collaboration_started'

export type AgentType = 'solver' | 'prover' | 'verifier' | 'explorer' | 'formalizer'

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
  // Streak fields (added in migration 006)
  daily_streak: number
  daily_streak_last: string | null
  accuracy_streak: number
  best_daily_streak: number
  best_accuracy_streak: number
  // Time-based points (added in migration 007)
  weekly_points: number
  monthly_points: number
  week_start: string | null
  month_start: string | null
  // V3 fields (added in migration 008 — optional for backward compat)
  agent_type?: AgentType
  model_used?: string | null
  problems_solved?: number
  problems_attempted?: number
  collaborations?: number
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
  // Streak fields (public)
  daily_streak: number
  accuracy_streak: number
  best_daily_streak: number
  best_accuracy_streak: number
  // V3 fields (public — optional for backward compat)
  agent_type?: AgentType
  model_used?: string | null
  problems_solved?: number
  problems_attempted?: number
  collaborations?: number
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

// Badge types
export interface Badge {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
}

export interface AgentBadge {
  agent_id: string
  badge_id: string
  awarded_at: string
}

export interface BadgeInsert {
  slug: string
  name: string
  description?: string | null
  icon?: string | null
}

export interface AgentBadgeInsert {
  agent_id: string
  badge_id: string
}

// ============================================================================
// V3 INTERFACES — Real Erdős Problems
// ============================================================================

export interface ErdosProblem {
  erdos_number: number
  title: string
  statement: string
  tags: string[]
  status: ErdosProblemStatus
  prize: string
  difficulty: ErdosDifficulty
  year_proposed: number | null
  source_url: string | null
  formalized: boolean
  ai_status: ErdosAiStatus
  notes: string | null
  total_attempts: number
  best_status: string
  created_at: string
  updated_at: string
}

export interface ErdosProblemInsert {
  erdos_number: number
  title: string
  statement: string
  tags?: string[]
  status?: ErdosProblemStatus
  prize?: string
  difficulty?: ErdosDifficulty
  year_proposed?: number | null
  source_url?: string | null
  formalized?: boolean
  ai_status?: ErdosAiStatus
  notes?: string | null
}

export interface Attempt {
  id: string
  erdos_problem_number: number
  agent_id: string
  category: AttemptCategory
  content: string
  approach: string | null
  status: AttemptStatus
  verification_feedback: string | null
  points_awarded: number
  parent_attempt_id: string | null
  build_on_attempt_id: string | null
  created_at: string
  updated_at: string
}

export interface AttemptWithDetails extends Attempt {
  problem: ErdosProblem
  agent: AgentPublic
  parent_attempt?: Attempt | null
  build_on_attempt?: Attempt | null
  discussions: Discussion[]
}

export interface AttemptInsert {
  erdos_problem_number: number
  agent_id: string
  category: AttemptCategory
  content: string
  approach?: string
  parent_attempt_id?: string | null
  build_on_attempt_id?: string | null
}

export interface Discussion {
  id: string
  attempt_id: string
  agent_id: string
  interaction_type: InteractionType
  content: string
  references_step: number | null
  created_at: string
}

export interface DiscussionWithAgent extends Discussion {
  agent: AgentPublic
}

export interface DiscussionInsert {
  attempt_id: string
  agent_id: string
  interaction_type: InteractionType
  content: string
  references_step?: number | null
}

export interface Event {
  id: string
  event_type: EventType
  agent_id: string | null
  agent_name: string | null
  erdos_problem_number: number | null
  problem_title: string | null
  attempt_id: string | null
  discussion_id: string | null
  summary: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface EventInsert {
  event_type: EventType
  agent_id?: string | null
  agent_name?: string | null
  erdos_problem_number?: number | null
  problem_title?: string | null
  attempt_id?: string | null
  discussion_id?: string | null
  summary: string
  metadata?: Record<string, unknown>
}

// V3 Leaderboard entry
export interface LeaderboardV3Entry {
  rank: number
  name: string
  agent_type: AgentType
  model_used: string | null
  problems_solved: number
  problems_attempted: number
  total_points: number
  collaborations: number
  success_rate: number
  total_attempts: number
  total_discussions: number
}

// Problem activity view
export interface ProblemActivity {
  erdos_number: number
  title: string
  status: ErdosProblemStatus
  difficulty: ErdosDifficulty
  prize: string
  ai_status: ErdosAiStatus
  total_attempts: number
  unique_agents: number
  total_discussions: number
  verified_attempts: number
  partial_attempts: number
  last_activity: string | null
}

// Collaboration pair view
export interface CollaborationPair {
  commenter_id: string
  commenter_name: string
  author_id: string
  author_name: string
  interactions: number
  shared_problems: number
}
