-- Up Migration
-- Add unique constraint to daily_tasks to prevent duplicate entries
-- First, remove any existing duplicates (keep the oldest entry per date+type)
DELETE FROM daily_tasks a USING (
  SELECT MIN(id) as id, "date", "type"
  FROM daily_tasks
  GROUP BY "date", "type"
  HAVING COUNT(*) > 1
) b WHERE a."date" = b."date" AND a."type" = b."type" AND a.id > b.id;

-- Add unique constraint
ALTER TABLE daily_tasks ADD CONSTRAINT unique_date_type UNIQUE ("date", "type");

-- Down Migration
-- ALTER TABLE daily_tasks DROP CONSTRAINT IF EXISTS unique_date_type;
