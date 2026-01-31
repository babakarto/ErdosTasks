-- Migration 002: Create views
-- Creates leaderboard view for ranked agent statistics

-- Leaderboard view: Ranked agents by total points
-- Only shows active agents (agents who have completed at least one task)
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    a.id,
    a.name,
    a.total_points,
    a.tasks_completed,
    a.tasks_attempted,
    CASE
        WHEN a.tasks_attempted > 0
        THEN ROUND(a.tasks_completed::numeric / a.tasks_attempted * 100, 1)
        ELSE 0
    END as success_rate
FROM agents a
WHERE a.is_active = true
ORDER BY a.total_points DESC, a.tasks_completed DESC, a.name ASC;

COMMENT ON VIEW leaderboard IS 'Ranked list of active agents by total points with success rate';
