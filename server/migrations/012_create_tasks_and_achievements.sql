-- Add new counters for scratch achievements
ALTER TABLE players ADD COLUMN IF NOT EXISTS "scratchTier1Count" INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "scratchTier0Count" INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS "totalScratchCount" INTEGER DEFAULT 0;

-- Create clock-in table
CREATE TABLE IF NOT EXISTS player_clock_ins (
  "playerId" TEXT PRIMARY KEY,
  "month" TEXT NOT NULL,
  "count" INTEGER DEFAULT 0,
  "last_clock_in" TEXT DEFAULT NULL
);

-- Create achievements definition table
CREATE TABLE IF NOT EXISTS achievements (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "condition_field" TEXT NOT NULL,
  "condition_value" INTEGER NOT NULL,
  "reward_money" INTEGER NOT NULL
);

-- Create player achievements progress table
CREATE TABLE IF NOT EXISTS player_achievements (
  "playerId" TEXT,
  "achievementId" INTEGER,
  "claimed" BOOLEAN DEFAULT FALSE,
  PRIMARY KEY ("playerId", "achievementId")
);

-- Insert initial achievements
INSERT INTO achievements ("name", "description", "icon", "condition_field", "condition_value", "reward_money") VALUES
  ('仙人附体', '累计获得 10 次一等奖', '🎫', 'scratchTier1Count', 10, 100000),
  ('我要验牌', '累计刮奖 100 次', '🔍', 'totalScratchCount', 100, 20000),
  ('赌狗不得 house', '累计获得 100 次三等奖', '🐶', 'scratchTier0Count', 100, 500),
  ('欧皇附体', '抽中一次 SSR', '✨', 'ssrCount', 1, 20000),
  ('坚持不懈，总有一天？', '累计抽奖 100 次', '🎰', 'totalGachaCount', 100, 10000),
  ('富甲一方', '累计获得 10 万金币', '💰', 'totalMoneyEarned', 100000, 5000),
  ('真正的 007', '累计挂机 24 小时', '🛌', 'totalIdleTime', 86400, 5000)
ON CONFLICT DO NOTHING;
