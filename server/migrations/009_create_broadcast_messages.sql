-- Create broadcast_messages table
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  rarity TEXT NOT NULL,
  created_at INTEGER DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
);
