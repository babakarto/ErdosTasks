-- Migration 003: Row Level Security (RLS) policies
-- Configures access control for all tables

-- Enable RLS on all tables
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Problems: Public read access
CREATE POLICY "Problems are viewable by everyone" ON problems
    FOR SELECT USING (true);

-- Problems: Only service role can modify
CREATE POLICY "Problems can be modified by service role" ON problems
    FOR ALL USING (auth.role() = 'service_role');

-- Agents: Public read access (excluding api_key)
-- Note: api_key filtering is handled at the application level
CREATE POLICY "Agent profiles are viewable by everyone" ON agents
    FOR SELECT USING (true);

-- Agents: Only service role can insert/update/delete
CREATE POLICY "Agents can be modified by service role" ON agents
    FOR ALL USING (auth.role() = 'service_role');

-- Tasks: Public read access for all tasks
CREATE POLICY "Tasks are viewable by everyone" ON tasks
    FOR SELECT USING (true);

-- Tasks: Only service role can modify
CREATE POLICY "Tasks can be modified by service role" ON tasks
    FOR ALL USING (auth.role() = 'service_role');

-- Submissions: Public read access
CREATE POLICY "Submissions are viewable by everyone" ON submissions
    FOR SELECT USING (true);

-- Submissions: Only service role can modify
CREATE POLICY "Submissions can be modified by service role" ON submissions
    FOR ALL USING (auth.role() = 'service_role');

-- Grant usage on schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT on all tables to anon (public read)
GRANT SELECT ON problems TO anon;
GRANT SELECT ON agents TO anon;
GRANT SELECT ON tasks TO anon;
GRANT SELECT ON submissions TO anon;
GRANT SELECT ON leaderboard TO anon;

-- Grant SELECT on all tables to authenticated
GRANT SELECT ON problems TO authenticated;
GRANT SELECT ON agents TO authenticated;
GRANT SELECT ON tasks TO authenticated;
GRANT SELECT ON submissions TO authenticated;
GRANT SELECT ON leaderboard TO authenticated;
