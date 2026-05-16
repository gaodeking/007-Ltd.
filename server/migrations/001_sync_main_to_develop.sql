-- Up Migration
-- Sync main branch database changes to develop

-- 1. Players table columns (v0.0.5B, v0.0.6A, v0.1.1, v0.1.2)
ALTER TABLE players ADD COLUMN IF NOT EXISTS "lastHeartbeat" INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "avatar" TEXT DEFAULT '‍♂️';
ALTER TABLE players ADD COLUMN IF NOT EXISTS "has_seen_onboarding" BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "last_login_date" TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "scratchEarnings" INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "currentScratchTicket" JSONB;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "scratchTier1Count" INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "scratchTier0Count" INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "totalScratchCount" INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "activityStatus" TEXT;

-- 2. Announcements table (v0.1.0)
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "version" TEXT,
  "active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 3. Bug reports table (v0.1.0)
CREATE TABLE IF NOT EXISTS bug_reports (
  id SERIAL PRIMARY KEY,
  "player_id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 4. Player clock-ins table (v0.1.2)
CREATE TABLE IF NOT EXISTS player_clock_ins (
  id SERIAL PRIMARY KEY,
  "playerId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "count" INTEGER DEFAULT 0,
  "last_clock_in" TEXT,
  UNIQUE("playerId", "month")
);

-- 5. Achievements table (v0.1.2)
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "condition_field" TEXT NOT NULL,
  "condition_value" INTEGER NOT NULL,
  "reward_money" INTEGER DEFAULT 0,
  UNIQUE("name")
);

-- 6. Player achievements table (v0.1.2)
CREATE TABLE IF NOT EXISTS player_achievements (
  id SERIAL PRIMARY KEY,
  "playerId" TEXT NOT NULL,
  "achievementId" INTEGER NOT NULL,
  "claimed" BOOLEAN DEFAULT FALSE,
  UNIQUE("playerId", "achievementId")
);

-- 7. Heavy activities table (v0.1.2)
CREATE TABLE IF NOT EXISTS heavy_activities (
  activity_id TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "active" BOOLEAN DEFAULT TRUE
);

-- 8. Broadcast messages table (v0.1.2)
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  rarity TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Seats unique index (Ghost seat fix)
CREATE UNIQUE INDEX IF NOT EXISTS idx_seats_playerId_unique ON seats("playerId") WHERE "playerId" IS NOT NULL;
