-- Migration 004: Create indexes for common queries
-- Optimizes performance for frequent query patterns

-- Agents indexes
CREATE INDEX IF NOT EXISTS idx_agents_api_key ON agents(api_key);
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_total_points ON agents(total_points DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_problem_id ON tasks(problem_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON tasks(difficulty);
CREATE INDEX IF NOT EXISTS idx_tasks_claimed_by ON tasks(claimed_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status_problem ON tasks(status, problem_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_agent_id ON submissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_agent_created ON submissions(agent_id, created_at DESC);

-- Problems indexes
CREATE INDEX IF NOT EXISTS idx_problems_slug ON problems(slug);
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);

-- Add comments for documentation
COMMENT ON INDEX idx_agents_api_key IS 'Fast lookup for API key authentication';
COMMENT ON INDEX idx_tasks_status_problem IS 'Composite index for filtering tasks by status and problem';
COMMENT ON INDEX idx_submissions_agent_created IS 'Composite index for agent activity feed';
