-- Up Migration
-- Add last_news_at column to stocks table for news cooldown tracking

ALTER TABLE stocks ADD COLUMN IF NOT EXISTS last_news_at TIMESTAMP;

-- Down Migration
-- ALTER TABLE stocks DROP COLUMN IF EXISTS last_news_at;
