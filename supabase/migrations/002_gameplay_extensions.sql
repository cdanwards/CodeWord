-- Migration: Add gameplay schema extensions for Codeword/Assassins MVP

-- Games: add join code, host, status, timing, and settings
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS code VARCHAR(8) NOT NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS host_user_id UUID NOT NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','active','finished','canceled')),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS duration_hours INTEGER NOT NULL DEFAULT 72,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- FK host to auth.users (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'games' AND c.conname = 'games_host_user_id_fkey'
  ) THEN
    ALTER TABLE games
      ADD CONSTRAINT games_host_user_id_fkey
      FOREIGN KEY (host_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index for quick lookup by code
CREATE INDEX IF NOT EXISTS idx_games_code ON games(code);

-- Membership extensions on user_games
ALTER TABLE user_games
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('host','player')),
  ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','eliminated','left')),
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS eliminated_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMP;

-- Uniqueness to prevent duplicate memberships
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'user_games_user_id_game_id_key'
  ) THEN
    ALTER TABLE user_games ADD CONSTRAINT user_games_user_id_game_id_key UNIQUE (user_id, game_id);
  END IF;
END $$;

-- Table: game_words (word list grows over time)
CREATE TABLE IF NOT EXISTS game_words (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  day_number INTEGER NOT NULL DEFAULT 1,
  available_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, word)
);

-- Table: assignments (target assignments; optionally reference a game_words entry)
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  assassin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER REFERENCES game_words(id) ON DELETE SET NULL,
  round INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','reassigned','failed')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Table: eliminations (records of eliminations)
CREATE TABLE IF NOT EXISTS eliminations (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
  killer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  victim_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE game_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE eliminations ENABLE ROW LEVEL SECURITY;

-- Policies: members of a game can read; host controls writes

-- Helper checks as inline subqueries
-- game membership: exists membership row for current user
-- host check: current user is the game's host

-- game_words policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_words' AND policyname = 'Members can view game words'
  ) THEN
    CREATE POLICY "Members can view game words" ON game_words
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM user_games ug
          WHERE ug.game_id = game_words.game_id AND ug.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_words' AND policyname = 'Host can manage game words'
  ) THEN
    CREATE POLICY "Host can manage game words" ON game_words
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM games g WHERE g.id = game_words.game_id AND g.host_user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM games g WHERE g.id = game_words.game_id AND g.host_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- assignments policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assignments' AND policyname = 'Members can view assignments'
  ) THEN
    CREATE POLICY "Members can view assignments" ON assignments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM user_games ug
          WHERE ug.game_id = assignments.game_id AND ug.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assignments' AND policyname = 'Host can manage assignments'
  ) THEN
    CREATE POLICY "Host can manage assignments" ON assignments
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM games g WHERE g.id = assignments.game_id AND g.host_user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM games g WHERE g.id = assignments.game_id AND g.host_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- eliminations policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'eliminations' AND policyname = 'Members can view eliminations'
  ) THEN
    CREATE POLICY "Members can view eliminations" ON eliminations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM user_games ug
          WHERE ug.game_id = eliminations.game_id AND ug.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'eliminations' AND policyname = 'Host can manage eliminations'
  ) THEN
    CREATE POLICY "Host can manage eliminations" ON eliminations
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM games g WHERE g.id = eliminations.game_id AND g.host_user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM games g WHERE g.id = eliminations.game_id AND g.host_user_id = auth.uid()
        )
      );
  END IF;
END $$;

