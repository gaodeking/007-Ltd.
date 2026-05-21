-- Up Migration
-- Upgrade money and avg_cost columns to BIGINT to prevent integer overflow
-- This allows values up to 9 quintillion, solving the crash issue for wealthy players.

ALTER TABLE players ALTER COLUMN money TYPE BIGINT;
ALTER TABLE player_stocks ALTER COLUMN avg_cost TYPE BIGINT;

-- Down Migration
-- ALTER TABLE players ALTER COLUMN money TYPE INTEGER;
-- ALTER TABLE player_stocks ALTER COLUMN avg_cost TYPE INTEGER;
