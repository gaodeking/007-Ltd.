-- Up Migration
-- Add player_name column to gacha_log and backfill historical data

-- 1. Add column if not exists
ALTER TABLE gacha_log ADD COLUMN IF NOT EXISTS "player_name" TEXT DEFAULT '无名冒险者';

-- 2. Backfill historical data: match playerId to players.name
-- Handles EMPTY, NULL, empty string, and default '无名冒险者'
UPDATE gacha_log gl
SET "player_name" = p.name
FROM players p
WHERE gl."playerId" = p.id
  AND (
    gl."player_name" = 'EMPTY' 
    OR gl."player_name" IS NULL 
    OR gl."player_name" = '' 
    OR gl."player_name" = '无名冒险者'
  );

-- Down Migration
-- ALTER TABLE gacha_log DROP COLUMN IF EXISTS "player_name";
