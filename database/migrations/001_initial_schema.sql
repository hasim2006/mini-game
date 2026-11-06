-- ==========================================================================
-- Mini Game Arcade - Production Relational SQL Migration
-- Target Engines: PostgreSQL, CockroachDB, SQLite
-- ==========================================================================

CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE NOT NULL,
    game_id VARCHAR(32) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    duration_seconds NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    difficulty VARCHAR(16) DEFAULT 'standard',
    moves INT DEFAULT 0,
    stars INT DEFAULT 0,
    device_viewport VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_game_score 
ON game_sessions (game_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at 
ON game_sessions (created_at DESC);

CREATE TABLE IF NOT EXISTS high_scores (
    game_id VARCHAR(32) PRIMARY KEY,
    high_score INT NOT NULL DEFAULT 0,
    best_time_seconds NUMERIC(8, 2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_inquiries (
    id SERIAL PRIMARY KEY,
    inquiry_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_created_at 
ON contact_inquiries (created_at DESC);

