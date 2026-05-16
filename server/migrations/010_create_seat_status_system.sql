-- Create activityStatus column in players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS "activityStatus" TEXT DEFAULT NULL;

-- Create heavy_activities configuration table
CREATE TABLE IF NOT EXISTS heavy_activities (
  activity_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Insert initial heavy activities
INSERT INTO heavy_activities (activity_id, name) VALUES 
  ('scratch', '命运九宫格'),
  ('arcade', '金蝶游乐场')
ON CONFLICT DO NOTHING;
