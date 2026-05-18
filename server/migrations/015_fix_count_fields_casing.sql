-- Up Migration
-- Rename camelCase columns to lowercase to match PostgreSQL default behavior
-- This fixes the issue where pg driver returns lowercase field names but code expects camelCase

-- Note: PostgreSQL RENAME COLUMN does not support IF EXISTS, so we use DO blocks for safety

DO $$ 
BEGIN
  -- Rename players table columns (only if they exist with camelCase names)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'totalGachaCount') THEN
    ALTER TABLE players RENAME COLUMN "totalGachaCount" TO "totalgachacount";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'totalIdleTime') THEN
    ALTER TABLE players RENAME COLUMN "totalIdleTime" TO "totalidletime";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'totalMoneyEarned') THEN
    ALTER TABLE players RENAME COLUMN "totalMoneyEarned" TO "totalmoneyearned";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'ssrCount') THEN
    ALTER TABLE players RENAME COLUMN "ssrCount" TO "ssrcount";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'srCount') THEN
    ALTER TABLE players RENAME COLUMN "srCount" TO "srcount";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'rCount') THEN
    ALTER TABLE players RENAME COLUMN "rCount" TO "rcount";
  END IF;
END $$;

-- Update achievements table condition_field values (safe to run multiple times)
UPDATE achievements SET condition_field = 'totalgachacount' WHERE condition_field = 'totalGachaCount';
UPDATE achievements SET condition_field = 'totalidletime' WHERE condition_field = 'totalIdleTime';
UPDATE achievements SET condition_field = 'totalmoneyearned' WHERE condition_field = 'totalMoneyEarned';
UPDATE achievements SET condition_field = 'ssrcount' WHERE condition_field = 'ssrCount';
UPDATE achievements SET condition_field = 'srcount' WHERE condition_field = 'srCount';
UPDATE achievements SET condition_field = 'rcount' WHERE condition_field = 'rCount';

-- Down Migration
-- DO $$ 
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'totalgachacount') THEN
--     ALTER TABLE players RENAME COLUMN "totalgachacount" TO "totalGachaCount";
--   END IF;
--   -- ... (similar for other columns)
-- END $$;
