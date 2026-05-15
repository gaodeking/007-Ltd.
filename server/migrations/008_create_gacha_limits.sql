-- Create gacha_limits table with safety constraints
CREATE TABLE IF NOT EXISTS gacha_limits (
  rarity TEXT PRIMARY KEY,
  "limit" INTEGER NOT NULL CHECK ("limit" >= 0)
);

-- Insert initial limits (SSR: 1, SR: 4, R: 8)
INSERT INTO gacha_limits (rarity, "limit") VALUES 
  ('ssr', 1), 
  ('sr', 4), 
  ('r', 8)
ON CONFLICT (rarity) DO NOTHING;
