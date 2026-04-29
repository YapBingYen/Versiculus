-- Versiculus Database Schema (V2 Complete)

-- 1. Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  push_subscription JSONB,
  email_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Verses Table
CREATE TABLE verses (
  id          SERIAL PRIMARY KEY,
  reference   VARCHAR(50) NOT NULL,       -- e.g., "John 3:16"
  full_text   TEXT NOT NULL,              -- Full verse text
  key_words   TEXT[] NOT NULL,            -- Array of blanked-out words
  difficulty  SMALLINT DEFAULT 1,         -- 1=Easy, 2=Medium, 3=Hard
  translation VARCHAR(10) DEFAULT 'NIV',  -- e.g., "NIV", "ESV", "KJV"
  last_used   DATE
);

-- 3. Daily Schedule Table
CREATE TABLE daily_schedule (
  play_date   DATE PRIMARY KEY,
  verse_id    INT REFERENCES verses(id)
);

-- 4. User Stats Table
CREATE TABLE user_stats (
  user_id           INT PRIMARY KEY REFERENCES users(id),
  games_played      INT DEFAULT 0,
  games_won         INT DEFAULT 0,
  current_streak    INT DEFAULT 0,
  max_streak        INT DEFAULT 0,
  last_played_date  DATE,
  guess_distribution JSONB DEFAULT '{}'  -- e.g., {"1":0,"2":3,"3":5,...}
);
