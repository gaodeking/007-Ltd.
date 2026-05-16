-- Add scratchEarnings column for cumulative net profit
ALTER TABLE players ADD COLUMN IF NOT EXISTS "scratchEarnings" INTEGER DEFAULT 0;

-- Add currentScratchTicket column for temporary ticket state (prevents loss on refresh)
ALTER TABLE players ADD COLUMN IF NOT EXISTS "currentScratchTicket" JSONB DEFAULT NULL;
