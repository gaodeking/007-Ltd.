-- Up Migration
-- Fix player_clock_ins table structure to support monthly records
-- Resolves conflict between migration 012 (single PK) and 001 (composite unique)

-- 1. Drop existing primary key constraint (playerId)
ALTER TABLE player_clock_ins DROP CONSTRAINT IF EXISTS player_clock_ins_pkey;

-- 2. Add id column as new primary key
ALTER TABLE player_clock_ins ADD COLUMN IF NOT EXISTS id SERIAL;
ALTER TABLE player_clock_ins ADD PRIMARY KEY (id);

-- 3. Add unique constraint for playerId + month combination
ALTER TABLE player_clock_ins ADD CONSTRAINT IF NOT EXISTS unique_player_month UNIQUE ("playerId", "month");

-- Down Migration
-- ALTER TABLE player_clock_ins DROP CONSTRAINT IF EXISTS unique_player_month;
-- ALTER TABLE player_clock_ins DROP CONSTRAINT IF EXISTS player_clock_ins_pkey;
-- ALTER TABLE player_clock_ins DROP COLUMN IF EXISTS id;
-- ALTER TABLE player_clock_ins ADD PRIMARY KEY ("playerId");
