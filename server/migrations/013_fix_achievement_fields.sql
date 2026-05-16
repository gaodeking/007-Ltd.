-- Rename totalgachacount to "totalGachaCount"
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'totalgachacount') THEN
        ALTER TABLE players RENAME COLUMN "totalgachacount" TO "totalGachaCount";
    END IF;
END $$;

-- Rename totalidletime to "totalIdleTime"
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'totalidletime') THEN
        ALTER TABLE players RENAME COLUMN "totalidletime" TO "totalIdleTime";
    END IF;
END $$;
