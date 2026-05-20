-- Up Migration
-- Create stock system tables and initialize FF14-themed stocks

-- 1. Stocks definition table
CREATE TABLE IF NOT EXISTS stocks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  center_price INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  volatility FLOAT NOT NULL,
  reversion_speed FLOAT NOT NULL,
  is_circuit_breaker BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Stock price history table (for K-line)
CREATE TABLE IF NOT EXISTS stock_history (
  id SERIAL PRIMARY KEY,
  stock_id TEXT REFERENCES stocks(id),
  price INTEGER NOT NULL,
  timestamp INTEGER DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
);

-- 3. Player stock holdings table
CREATE TABLE IF NOT EXISTS player_stocks (
  playerId TEXT,
  stock_id TEXT REFERENCES stocks(id),
  quantity INTEGER DEFAULT 0,
  avg_cost INTEGER DEFAULT 0,
  PRIMARY KEY (playerId, stock_id)
);

-- Initialize 4 FF14-themed stocks
INSERT INTO stocks (id, name, center_price, current_price, volatility, reversion_speed) VALUES
  ('MOG', '莫古力信托', 100, 100, 0.05, 0.20),
  ('KWEH', '陆行鸟航空', 800, 800, 0.10, 0.15),
  ('AET', '水晶交易所', 2500, 2500, 0.15, 0.15),
  ('GAR', '加雷马重工', 5000, 5000, 0.20, 0.10)
ON CONFLICT (id) DO NOTHING;

-- Down Migration
-- DROP TABLE IF EXISTS player_stocks;
-- DROP TABLE IF EXISTS stock_history;
-- DROP TABLE IF EXISTS stocks;
