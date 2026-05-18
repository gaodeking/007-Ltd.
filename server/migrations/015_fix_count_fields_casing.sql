-- Up Migration
-- Rename camelCase columns to lowercase to match PostgreSQL default behavior
-- This fixes the issue where pg driver returns lowercase field names but code expects camelCase

-- 1. Rename players table columns
ALTER TABLE players RENAME COLUMN IF EXISTS "totalGachaCount" TO "totalgachacount";
ALTER TABLE players RENAME COLUMN IF EXISTS "totalIdleTime" TO "totalidletime";
ALTER TABLE players RENAME COLUMN IF EXISTS "totalMoneyEarned" TO "totalmoneyearned";
ALTER TABLE players RENAME COLUMN IF EXISTS "ssrCount" TO "ssrcount";
ALTER TABLE players RENAME COLUMN IF EXISTS "srCount" TO "srcount";
ALTER TABLE players RENAME COLUMN IF EXISTS "rCount" TO "rcount";

-- 2. Update achievements table condition_field values
UPDATE achievements SET condition_field = 'totalgachacount' WHERE condition_field = 'totalGachaCount';
UPDATE achievements SET condition_field = 'totalidletime' WHERE condition_field = 'totalIdleTime';
UPDATE achievements SET condition_field = 'totalmoneyearned' WHERE condition_field = 'totalMoneyEarned';
UPDATE achievements SET condition_field = 'ssrcount' WHERE condition_field = 'ssrCount';
UPDATE achievements SET condition_field = 'srcount' WHERE condition_field = 'srCount';
UPDATE achievements SET condition_field = 'rcount' WHERE condition_field = 'rCount';

-- Down Migration
-- ALTER TABLE players RENAME COLUMN "totalgachacount" TO "totalGachaCount";
-- ALTER TABLE players RENAME COLUMN "totalidletime" TO "totalIdleTime";
-- ALTER TABLE players RENAME COLUMN "totalmoneyearned" TO "totalMoneyEarned";
-- ALTER TABLE players RENAME COLUMN "ssrcount" TO "ssrCount";
-- ALTER TABLE players RENAME COLUMN "srcount" TO "srCount";
-- ALTER TABLE players RENAME COLUMN "rcount" TO "rCount";
-- UPDATE achievements SET condition_field = 'totalGachaCount' WHERE condition_field = 'totalgachacount';
-- UPDATE achievements SET condition_field = 'totalIdleTime' WHERE condition_field = 'totalidletime';
-- UPDATE achievements SET condition_field = 'totalMoneyEarned' WHERE condition_field = 'totalmoneyearned';
-- UPDATE achievements SET condition_field = 'ssrCount' WHERE condition_field = 'ssrcount';
-- UPDATE achievements SET condition_field = 'srCount' WHERE condition_field = 'srcount';
-- UPDATE achievements SET condition_field = 'rCount' WHERE condition_field = 'rcount';
