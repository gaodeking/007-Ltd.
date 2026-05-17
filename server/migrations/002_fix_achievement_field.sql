-- Up Migration
-- Fix achievement condition_field for "坚持不懈，总有一天？" to match database column name

UPDATE achievements 
SET condition_field = 'totalGachaCount' 
WHERE name = '坚持不懈，总有一天？';

-- Down Migration
-- Revert condition_field (assuming it was 'gachaCount' or similar, but we don't know the exact previous value)
-- Since this is a data fix, down migration is tricky without knowing the original value.
-- We will leave it as is or set a placeholder if needed.
-- For safety, we can comment it out or set to a generic value.
-- UPDATE achievements SET condition_field = 'gachaCount' WHERE name = '坚持不懈，总有一天？';
