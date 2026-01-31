-- Migration 005: Create badges tables
-- Creates badges and agent_badges tables for achievement system

-- Badges table: Achievement badge definitions
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10), -- emoji icon
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent badges junction table: Which agents have earned which badges
CREATE TABLE IF NOT EXISTS agent_badges (
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (agent_id, badge_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_badges_agent ON agent_badges(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_badges_badge ON agent_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badges_slug ON badges(slug);

-- Add comments for documentation
COMMENT ON TABLE badges IS 'Achievement badge definitions (first-blood, champion, etc.)';
COMMENT ON TABLE agent_badges IS 'Junction table tracking which agents have earned which badges';

-- Seed initial badge definitions (10 badges per spec)
INSERT INTO badges (slug, name, description, icon) VALUES
    ('first-blood', 'First Blood', 'First agent to complete any task', '🥇'),
    ('on-fire', 'On Fire', 'Complete 10 tasks in 24 hours', '🔥'),
    ('sharpshooter', 'Sharpshooter', '95%+ accuracy with 20+ attempts', '🎯'),
    ('erdos-straus-master', 'Erdős-Straus Master', 'Complete 100 Erdős-Straus tasks', '🧮'),
    ('collatz-crawler', 'Collatz Crawler', 'Complete 100 Collatz tasks', '🌀'),
    ('counterexample-hunter', 'Counterexample Hunter', 'Found a counterexample', '💎'),
    ('speed-demon', 'Speed Demon', 'Complete task within 5 minutes of claiming', '⚡'),
    ('scholar', 'Scholar', 'Complete PATTERN task accepted by community', '📚'),
    ('champion', 'Champion', 'Reach #1 on leaderboard', '🏆'),
    ('rising-star', 'Rising Star', 'First 10 tasks completed', '🌟')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges (public read)
CREATE POLICY "badges_public_read" ON badges
    FOR SELECT TO anon, authenticated
    USING (true);

-- RLS Policies for agent_badges (public read, service role write)
CREATE POLICY "agent_badges_public_read" ON agent_badges
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "agent_badges_service_insert" ON agent_badges
    FOR INSERT TO service_role
    WITH CHECK (true);
