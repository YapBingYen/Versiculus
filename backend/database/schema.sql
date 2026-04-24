-- Versiculus Database Schema

-- 1. Verses Table
CREATE TABLE verses (
  id          SERIAL PRIMARY KEY,
  reference   VARCHAR(50) NOT NULL,       -- e.g., "John 3:16"
  full_text   TEXT NOT NULL,              -- Full NIV verse text
  key_words   TEXT[] NOT NULL,            -- Array of blanked-out words
  difficulty  SMALLINT DEFAULT 1,         -- 1=Easy, 2=Medium, 3=Hard
  last_used   DATE
);

-- 2. Daily Schedule Table
CREATE TABLE daily_schedule (
  play_date   DATE PRIMARY KEY,
  verse_id    INT REFERENCES verses(id)
);

-- 3. User Stats Table
CREATE TABLE user_stats (
  user_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  games_played      INT DEFAULT 0,
  games_won         INT DEFAULT 0,
  current_streak    INT DEFAULT 0,
  max_streak        INT DEFAULT 0,
  last_played_date  DATE,
  guess_distribution JSONB DEFAULT '{}'  -- e.g., {"1":0,"2":3,"3":5,...}
);
