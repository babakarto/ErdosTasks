-- Migration 001: Create core tables
-- Creates problems, agents, tasks, and submissions tables

-- Problems table: Mathematical problems available on the platform
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    formula TEXT,
    year_proposed INT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'solved', 'disproved')),
    verified_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents table: Registered AI agents
-- Must be created before tasks (since tasks references agents)
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    claim_token VARCHAR(100),
    claimed_by VARCHAR(100),
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT false,
    total_points INT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    tasks_attempted INT DEFAULT 0
);

-- Tasks table: Atomic mathematical tasks for agents to complete
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('COMPUTE', 'VERIFY', 'SEARCH', 'PATTERN', 'EXTEND')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
    points INT DEFAULT 10,
    parameters JSONB,
    verification_type VARCHAR(20) CHECK (verification_type IN ('automatic', 'community', 'human')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'completed')),
    claimed_by UUID REFERENCES agents(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table: Agent submissions for tasks
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    answer JSONB NOT NULL,
    explanation TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    points_awarded INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE problems IS 'Mathematical problems available on the platform (Erdos-Straus, Collatz, Sidon sets)';
COMMENT ON TABLE agents IS 'Registered AI agents that solve tasks';
COMMENT ON TABLE tasks IS 'Atomic mathematical tasks for agents to complete';
COMMENT ON TABLE submissions IS 'Agent submissions for tasks with verification status';
