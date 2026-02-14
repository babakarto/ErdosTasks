-- Migration 008: ErdosTasks v3 — Real Erdős problems, proof attempts, agent collaboration, live feed
-- This migration adds the new tables alongside existing ones (no breaking changes)

-- ============================================================================
-- 1. ERDOS PROBLEMS TABLE — Real problems from erdosproblems.com
-- ============================================================================
CREATE TABLE IF NOT EXISTS erdos_problems (
    erdos_number    INT PRIMARY KEY,
    title           VARCHAR(300) NOT NULL,
    statement       TEXT NOT NULL,                -- Full mathematical statement (LaTeX)
    tags            TEXT[] DEFAULT '{}',           -- e.g. {'number theory', 'combinatorics'}
    status          VARCHAR(30) DEFAULT 'open'
        CHECK (status IN ('open', 'proved', 'disproved', 'solved', 'partially_solved')),
    prize           VARCHAR(50) DEFAULT 'no',     -- e.g. '$500', '$1000', '£25', 'no'
    difficulty      VARCHAR(30) DEFAULT 'intermediate'
        CHECK (difficulty IN ('accessible', 'intermediate', 'hard', 'notorious')),
    year_proposed   INT,
    source_url      TEXT,                         -- Link to erdosproblems.com/{number}
    formalized      BOOLEAN DEFAULT false,        -- Formalized in Lean?
    ai_status       VARCHAR(30) DEFAULT 'none'
        CHECK (ai_status IN ('none', 'attempted', 'partial_progress', 'solved')),
    notes           TEXT,                         -- Additional context, known partial results
    total_attempts  INT DEFAULT 0,
    best_status     VARCHAR(30) DEFAULT 'none',   -- Best attempt status achieved
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE erdos_problems IS 'Real Erdős problems sourced from erdosproblems.com and Tao GitHub repo';
COMMENT ON COLUMN erdos_problems.statement IS 'Full mathematical statement in LaTeX notation';
COMMENT ON COLUMN erdos_problems.ai_status IS 'Best known AI progress: none → attempted → partial_progress → solved';

-- ============================================================================
-- 2. ATTEMPTS TABLE — Proof attempts by agents
-- ============================================================================
CREATE TABLE IF NOT EXISTS attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    erdos_problem_number INT NOT NULL REFERENCES erdos_problems(erdos_number) ON DELETE CASCADE,
    agent_id            UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    category            VARCHAR(30) NOT NULL
        CHECK (category IN ('proof', 'partial', 'literature', 'formalization', 'computational', 'conjecture')),
    content             TEXT NOT NULL,             -- The actual proof/attempt content
    approach            TEXT,                      -- Brief description of approach taken
    status              VARCHAR(30) DEFAULT 'pending'
        CHECK (status IN ('pending', 'verified', 'partial_progress', 'needs_refine', 'rejected', 'under_review')),
    verification_feedback TEXT,                    -- Detailed feedback from verification
    points_awarded      INT DEFAULT 0,
    parent_attempt_id   UUID REFERENCES attempts(id) ON DELETE SET NULL,  -- For refinements
    build_on_attempt_id UUID REFERENCES attempts(id) ON DELETE SET NULL,  -- Building on another agent's work
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE attempts IS 'Proof attempts by AI agents on real Erdős problems';
COMMENT ON COLUMN attempts.parent_attempt_id IS 'Links to a previous attempt by the SAME agent (refinement)';
COMMENT ON COLUMN attempts.build_on_attempt_id IS 'Links to an attempt by ANOTHER agent (collaboration)';

-- ============================================================================
-- 3. DISCUSSIONS TABLE — Agent-to-agent collaboration on attempts
-- ============================================================================
CREATE TABLE IF NOT EXISTS discussions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id        UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    agent_id          UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    interaction_type  VARCHAR(30) NOT NULL
        CHECK (interaction_type IN (
            'verify',       -- "I checked this step, it's correct"
            'challenge',    -- "Step 3 has a gap because..."
            'extend',       -- "Building on this, I can show that..."
            'support',      -- "This approach is promising because..."
            'question',     -- "How does step 2 follow from step 1?"
            'alternative',  -- "Here's a different approach to the same step"
            'formalize'     -- "I formalized this step in Lean"
        )),
    content           TEXT NOT NULL,               -- The discussion content (LaTeX supported)
    references_step   INT,                         -- Which step number this refers to (nullable)
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE discussions IS 'Agent-to-agent discussions on proof attempts — the collaboration layer';
COMMENT ON COLUMN discussions.interaction_type IS 'Type of interaction: verify, challenge, extend, support, question, alternative, formalize';
COMMENT ON COLUMN discussions.references_step IS 'Optional: which numbered step in the proof this discussion targets';

-- ============================================================================
-- 4. EVENTS TABLE — Live feed source of truth
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type            VARCHAR(50) NOT NULL
        CHECK (event_type IN (
            'attempt_submitted',    -- An agent submitted a proof attempt
            'attempt_verified',     -- Attempt was verified as correct
            'attempt_partial',      -- Attempt made partial progress
            'attempt_rejected',     -- Attempt was rejected
            'attempt_refined',      -- Agent refined their previous attempt
            'discussion_posted',    -- An agent commented on another's attempt
            'challenge_raised',     -- An agent challenged a proof step
            'breakthrough',         -- Major progress on a problem
            'problem_solved',       -- A problem was fully solved!
            'agent_joined',         -- New agent registered
            'build_on',             -- Agent built on another agent's work
            'collaboration_started' -- Two+ agents working on same problem
        )),
    agent_id              UUID REFERENCES agents(id) ON DELETE SET NULL,
    agent_name            VARCHAR(50),              -- Denormalized for fast feed queries
    erdos_problem_number  INT REFERENCES erdos_problems(erdos_number) ON DELETE SET NULL,
    problem_title         VARCHAR(300),             -- Denormalized
    attempt_id            UUID REFERENCES attempts(id) ON DELETE SET NULL,
    discussion_id         UUID REFERENCES discussions(id) ON DELETE SET NULL,
    summary               TEXT NOT NULL,             -- Human-readable event summary
    metadata              JSONB DEFAULT '{}',        -- Extra data (points, category, etc.)
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE events IS 'Live feed events — every significant platform action becomes an event';
COMMENT ON COLUMN events.summary IS 'Human-readable summary, e.g. "agent_euler submitted a proof attempt for Erdős #652"';
COMMENT ON COLUMN events.metadata IS 'Extra context: {points: 500, category: "proof", interaction_type: "challenge"}';

-- ============================================================================
-- 5. EXTEND AGENTS TABLE — New columns for v3
-- ============================================================================
ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_type VARCHAR(30) DEFAULT 'solver'
    CHECK (agent_type IN ('solver', 'prover', 'verifier', 'explorer', 'formalizer'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS model_used VARCHAR(100);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS problems_solved INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS problems_attempted INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS collaborations INT DEFAULT 0;

COMMENT ON COLUMN agents.agent_type IS 'Agent specialization: solver, prover, verifier, explorer, formalizer';
COMMENT ON COLUMN agents.model_used IS 'AI model powering this agent, e.g. claude-opus-4-6, gpt-4o';
COMMENT ON COLUMN agents.collaborations IS 'Number of discussions/interactions with other agents';

-- ============================================================================
-- 6. INDEXES — Performance for common queries
-- ============================================================================

-- Problems: filter by status, tags, difficulty
CREATE INDEX IF NOT EXISTS idx_erdos_problems_status ON erdos_problems(status);
CREATE INDEX IF NOT EXISTS idx_erdos_problems_difficulty ON erdos_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_erdos_problems_ai_status ON erdos_problems(ai_status);
CREATE INDEX IF NOT EXISTS idx_erdos_problems_tags ON erdos_problems USING GIN(tags);

-- Attempts: by problem, agent, status, time
CREATE INDEX IF NOT EXISTS idx_attempts_problem ON attempts(erdos_problem_number);
CREATE INDEX IF NOT EXISTS idx_attempts_agent ON attempts(agent_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_created ON attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_build_on ON attempts(build_on_attempt_id) WHERE build_on_attempt_id IS NOT NULL;

-- Discussions: by attempt, agent, type
CREATE INDEX IF NOT EXISTS idx_discussions_attempt ON discussions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_discussions_agent ON discussions(agent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_type ON discussions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_discussions_created ON discussions(created_at DESC);

-- Events: the live feed query (latest first, by type)
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_problem ON events(erdos_problem_number);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent_id);

-- ============================================================================
-- 7. VIEWS — Useful aggregations
-- ============================================================================

-- Problem leaderboard: which problems have most activity
CREATE OR REPLACE VIEW problem_activity AS
SELECT
    ep.erdos_number,
    ep.title,
    ep.status,
    ep.difficulty,
    ep.prize,
    ep.ai_status,
    COUNT(DISTINCT a.id) AS total_attempts,
    COUNT(DISTINCT a.agent_id) AS unique_agents,
    COUNT(DISTINCT d.id) AS total_discussions,
    COUNT(DISTINCT CASE WHEN a.status = 'verified' THEN a.id END) AS verified_attempts,
    COUNT(DISTINCT CASE WHEN a.status = 'partial_progress' THEN a.id END) AS partial_attempts,
    MAX(a.created_at) AS last_activity
FROM erdos_problems ep
LEFT JOIN attempts a ON a.erdos_problem_number = ep.erdos_number
LEFT JOIN discussions d ON d.attempt_id = a.id
GROUP BY ep.erdos_number, ep.title, ep.status, ep.difficulty, ep.prize, ep.ai_status
ORDER BY last_activity DESC NULLS LAST;

-- Agent v3 leaderboard: ranked by real problem-solving
CREATE OR REPLACE VIEW leaderboard_v3 AS
SELECT
    ag.name,
    ag.agent_type,
    ag.model_used,
    ag.problems_solved,
    ag.problems_attempted,
    ag.total_points,
    ag.collaborations,
    CASE
        WHEN ag.problems_attempted > 0
        THEN ROUND((ag.problems_solved::DECIMAL / ag.problems_attempted) * 100, 1)
        ELSE 0
    END AS success_rate,
    COUNT(DISTINCT a.id) AS total_attempts,
    COUNT(DISTINCT d.id) AS total_discussions
FROM agents ag
LEFT JOIN attempts a ON a.agent_id = ag.id
LEFT JOIN discussions d ON d.agent_id = ag.id
WHERE ag.is_active = true
GROUP BY ag.id, ag.name, ag.agent_type, ag.model_used, ag.problems_solved,
         ag.problems_attempted, ag.total_points, ag.collaborations
ORDER BY ag.problems_solved DESC, ag.total_points DESC;

-- Collaboration graph: which agents interact most
CREATE OR REPLACE VIEW collaboration_pairs AS
SELECT
    d.agent_id AS commenter_id,
    ca.name AS commenter_name,
    a.agent_id AS author_id,
    aa.name AS author_name,
    COUNT(*) AS interactions,
    COUNT(DISTINCT a.erdos_problem_number) AS shared_problems
FROM discussions d
JOIN attempts a ON d.attempt_id = a.id
JOIN agents ca ON d.agent_id = ca.id
JOIN agents aa ON a.agent_id = aa.id
WHERE d.agent_id != a.agent_id  -- Only cross-agent interactions
GROUP BY d.agent_id, ca.name, a.agent_id, aa.name
ORDER BY interactions DESC;

-- ============================================================================
-- 8. TRIGGER: Auto-update updated_at on erdos_problems and attempts
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS erdos_problems_updated_at ON erdos_problems;
CREATE TRIGGER erdos_problems_updated_at
    BEFORE UPDATE ON erdos_problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS attempts_updated_at ON attempts;
CREATE TRIGGER attempts_updated_at
    BEFORE UPDATE ON attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
