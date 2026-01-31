-- Migration 006: Add streak tracking columns to agents
-- Adds columns for tracking daily and accuracy streaks

-- Add streak columns to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS daily_streak INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS daily_streak_last DATE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS accuracy_streak INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS best_daily_streak INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS best_accuracy_streak INT DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN agents.daily_streak IS 'Current consecutive days with at least 1 completed task';
COMMENT ON COLUMN agents.daily_streak_last IS 'Date of last daily streak update';
COMMENT ON COLUMN agents.accuracy_streak IS 'Current consecutive successful submissions (resets on failure)';
COMMENT ON COLUMN agents.best_daily_streak IS 'Best daily streak ever achieved';
COMMENT ON COLUMN agents.best_accuracy_streak IS 'Best accuracy streak ever achieved';
