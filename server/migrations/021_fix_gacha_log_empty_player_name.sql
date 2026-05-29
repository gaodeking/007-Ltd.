-- Up Migration
-- Fix gacha_log records with empty string or NULL player_name
-- This migration is idempotent and safe to run multiple times

UPDATE gacha_log gl
SET "player_name" = p.name
FROM players p
WHERE gl."playerId" = p.id
  AND (gl."player_name" = '' OR gl."player_name" IS NULL);

-- Down Migration
-- No down migration needed (data repair only)
