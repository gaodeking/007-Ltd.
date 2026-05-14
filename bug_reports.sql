CREATE TABLE IF NOT EXISTS bug_reports (
    id SERIAL PRIMARY KEY,
    player_id TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
