-- Migration: only the game engine reads and writes the game-state tables.
--
-- Policies left over from 002/004 let any member SELECT every assignment (who is hunting whom)
-- and every elimination including its `word` (a word the killer still holds), and let the host
-- write assignments, eliminations and results directly. The app uses the engine functions from
-- 005 for all of this (they are SECURITY DEFINER and bypass RLS), so clients get no direct access.
-- RLS stays enabled with no policies, which denies everything to anon and authenticated.

DROP POLICY IF EXISTS "Members can view assignments" ON assignments;
DROP POLICY IF EXISTS "Host can manage assignments" ON assignments;

DROP POLICY IF EXISTS "Members can view eliminations" ON eliminations;
DROP POLICY IF EXISTS "Host can manage eliminations" ON eliminations;

DROP POLICY IF EXISTS "Users can view their own confirmations" ON elimination_confirmations;
DROP POLICY IF EXISTS "Users can insert their own confirmations" ON elimination_confirmations;
DROP POLICY IF EXISTS "Users can update their own confirmations" ON elimination_confirmations;

DROP POLICY IF EXISTS "Hosts can manage game results" ON game_results;
-- "Users can view results for their games" stays: results are public to the game's members.

-- Status and lifecycle columns on memberships are engine-owned too: a player must not be able to
-- mark themselves active again after being eliminated.
DROP POLICY IF EXISTS "Users can update their own game records" ON user_games;

-- Leaving mid-operation would break the target chain, so you can only leave from the lobby.
DROP POLICY IF EXISTS "Users can delete their own game records" ON user_games;
CREATE POLICY "Users can leave games in the lobby" ON user_games
  FOR DELETE USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM games g WHERE g.id = game_id AND g.status = 'lobby')
  );

-- Games: a host opens a game in the lobby and may edit its details only while it's there. Status,
-- times, code and host are engine-owned (start_game / end_game run as the table owner, so these
-- grants don't affect them).
DROP POLICY IF EXISTS "Users can insert their own games" ON games;
CREATE POLICY "Hosts open games in the lobby" ON games
  FOR INSERT WITH CHECK (
    auth.uid() = host_user_id AND status = 'lobby' AND started_at IS NULL AND ended_at IS NULL
  );

DROP POLICY IF EXISTS "Hosts can update their games" ON games;
CREATE POLICY "Hosts can edit their games in the lobby" ON games
  FOR UPDATE
  USING (auth.uid() = host_user_id AND status = 'lobby')
  WITH CHECK (auth.uid() = host_user_id AND status = 'lobby');

REVOKE UPDATE ON games FROM anon, authenticated;
GRANT UPDATE (name, description, duration_hours, settings, updated_at) ON games TO authenticated;
