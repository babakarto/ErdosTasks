-- Migration 007: Add time-based points for enhanced leaderboards
-- Adds columns for weekly and monthly point tracking

-- Add time-based points columns to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS weekly_points INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS monthly_points INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS week_start DATE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS month_start DATE;

-- Add comments for documentation
COMMENT ON COLUMN agents.weekly_points IS 'Points earned in the current week (resets Monday 00:00 UTC)';
COMMENT ON COLUMN agents.monthly_points IS 'Points earned in the current month (resets 1st of month 00:00 UTC)';
COMMENT ON COLUMN agents.week_start IS 'Start date of current week tracking period';
COMMENT ON COLUMN agents.month_start IS 'Start date of current month tracking period';

-- Create view for weekly leaderboard
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT
    name,
    weekly_points AS total_points,
    tasks_completed,
    CASE
        WHEN tasks_attempted > 0 THEN ROUND((tasks_completed::DECIMAL / tasks_attempted) * 100, 1)
        ELSE 0
    END AS success_rate
FROM agents
WHERE is_active = true
ORDER BY weekly_points DESC, tasks_completed DESC;

-- Create view for monthly leaderboard
CREATE OR REPLACE VIEW leaderboard_monthly AS
SELECT
    name,
    monthly_points AS total_points,
    tasks_completed,
    CASE
        WHEN tasks_attempted > 0 THEN ROUND((tasks_completed::DECIMAL / tasks_attempted) * 100, 1)
        ELSE 0
    END AS success_rate
FROM agents
WHERE is_active = true
ORDER BY monthly_points DESC, tasks_completed DESC;

-- Create view for accuracy-based leaderboard (minimum 20 attempts)
CREATE OR REPLACE VIEW leaderboard_accuracy AS
SELECT
    name,
    total_points,
    tasks_completed,
    tasks_attempted,
    CASE
        WHEN tasks_attempted > 0 THEN ROUND((tasks_completed::DECIMAL / tasks_attempted) * 100, 1)
        ELSE 0
    END AS success_rate
FROM agents
WHERE is_active = true AND tasks_attempted >= 20
ORDER BY success_rate DESC, tasks_completed DESC;
