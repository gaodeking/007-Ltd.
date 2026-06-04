-- Up Migration
-- Clean invalid data in player_stocks and players tables
-- Resolves NaN values causing stock buy/sell failures

-- 1. Fix player_stocks: set NULL/invalid avg_cost to 0
UPDATE player_stocks 
SET avg_cost = 0 
WHERE avg_cost IS NULL OR avg_cost::text = 'NaN';

-- 2. Fix player_stocks: set NULL/invalid quantity to 0
UPDATE player_stocks 
SET quantity = 0 
WHERE quantity IS NULL OR quantity < 0;

-- 3. Fix players: set NULL/invalid money to 0
UPDATE players 
SET money = 0 
WHERE money IS NULL OR money::text = 'NaN';

-- 4. Add CHECK constraints to prevent future invalid data
ALTER TABLE player_stocks ADD CONSTRAINT IF NOT EXISTS chk_quantity_non_negative CHECK (quantity >= 0);
ALTER TABLE player_stocks ADD CONSTRAINT IF NOT EXISTS chk_avg_cost_non_negative CHECK (avg_cost >= 0);

-- Down Migration
-- ALTER TABLE player_stocks DROP CONSTRAINT IF EXISTS chk_quantity_non_negative;
-- ALTER TABLE player_stocks DROP CONSTRAINT IF EXISTS chk_avg_cost_non_negative;
-- (No down migration needed for data cleanup)
