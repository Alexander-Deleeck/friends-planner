PRAGMA foreign_keys = ON;

-- Add datetime columns for availability with optional time-of-day
ALTER TABLE blocked_periods ADD COLUMN start_datetime TEXT;
ALTER TABLE blocked_periods ADD COLUMN end_datetime TEXT;

-- Backfill datetime columns from existing date-only data
UPDATE blocked_periods
SET
  start_datetime = start_date || 'T00:00:00.000Z',
  end_datetime   = end_date   || 'T23:59:59.999Z'
WHERE start_datetime IS NULL
  OR end_datetime IS NULL;

-- Indexes for datetime ranges
CREATE INDEX IF NOT EXISTS idx_blocked_periods_range_dt ON blocked_periods(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_blocked_periods_user_dt ON blocked_periods(user_id, start_datetime, end_datetime);

