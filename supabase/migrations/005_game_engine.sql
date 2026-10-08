-- Migration: server-side game engine
--
-- Rules (decided 2026-10-08):
-- * Every agent holds a growing arsenal of codewords. Getting your target to say ANY of your
--   words counts.
-- * Each day of the operation every surviving agent is issued one more word from a shared
--   word bank. Day 1 words are hard, day 2 medium, day 3 onward easy.
-- * The target confirms or disputes each kill report. A dispute voids the report.
-- * On a confirmed kill the killer inherits the victim's target and all of the victim's words.
--   When the inherited target is the killer, they are the last agent standing and win.
-- * The host is a player like everyone else.
--
-- Game actions run as SECURITY DEFINER functions that check auth.uid() themselves and lock the
-- game row, instead of client-side table writes. That replaces the migration 004 triggers, which
-- ran with the caller's (RLS-limited) permissions and could not see the other players.

-- ---------------------------------------------------------------------------------------------
-- Status vocabularies used by the app and these functions
-- ---------------------------------------------------------------------------------------------
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check
  CHECK (status IN ('lobby', 'active', 'ended', 'canceled'));

ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_status_check;
ALTER TABLE assignments ADD CONSTRAINT assignments_status_check
  CHECK (status IN ('active', 'succeeded', 'reassigned', 'void'));

-- ---------------------------------------------------------------------------------------------
-- Replace per-game host word lists with a shared, tiered word bank and per-agent arsenals
-- ---------------------------------------------------------------------------------------------
ALTER TABLE assignments DROP COLUMN IF EXISTS word_id;
DROP TABLE IF EXISTS game_words CASCADE;

CREATE TABLE word_bank (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  -- 1 = hard (rarely said), 2 = medium, 3 = easy (said all the time)
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 3)
);
ALTER TABLE word_bank ENABLE ROW LEVEL SECURITY;
-- No policies: only the engine functions read it.

CREATE TABLE agent_words (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  difficulty SMALLINT NOT NULL,
  -- the operation day the word was issued on (1-based)
  granted_day INTEGER NOT NULL,
  -- the agent the word was first issued to; differs from user_id once inherited
  issued_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- set when the word moved to its current holder through a confirmed kill
  inherited_from UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, word)
);
CREATE INDEX idx_agent_words_holder ON agent_words(game_id, user_id);
CREATE UNIQUE INDEX idx_agent_words_daily ON agent_words(game_id, issued_to, granted_day);
ALTER TABLE agent_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can view their own words" ON agent_words
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE eliminations ADD COLUMN IF NOT EXISTS word TEXT;

-- ---------------------------------------------------------------------------------------------
-- Visibility: players can see who else is in their games
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_game_member(p_game_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_games WHERE game_id = p_game_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION shares_game_with(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_games mine
    JOIN user_games theirs ON theirs.game_id = mine.game_id
    WHERE mine.user_id = auth.uid() AND theirs.user_id = p_user_id
  );
$$;

DROP POLICY IF EXISTS "Users can view their own game records" ON user_games;
CREATE POLICY "Members can view memberships in their games" ON user_games
  FOR SELECT USING (auth.uid() = user_id OR is_game_member(game_id));

-- Joining is only allowed while the operation is still in its lobby.
DROP POLICY IF EXISTS "Users can insert their own game records" ON user_games;
CREATE POLICY "Users can join games in the lobby" ON user_games
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM games g WHERE g.id = game_id AND g.status = 'lobby')
  );

CREATE POLICY "Players can view profiles of agents in their games" ON user_profiles
  FOR SELECT USING (shares_game_with(user_id));

-- ---------------------------------------------------------------------------------------------
-- Retire the migration 004 triggers; the functions below own this logic
-- ---------------------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_initialize_game_assignments ON games;
DROP TRIGGER IF EXISTS trigger_reassign_targets_after_elimination ON eliminations;
DROP TRIGGER IF EXISTS trigger_check_game_completion ON user_games;
DROP FUNCTION IF EXISTS initialize_game_assignments();
DROP FUNCTION IF EXISTS reassign_targets_after_elimination();
DROP FUNCTION IF EXISTS check_game_completion();

-- ---------------------------------------------------------------------------------------------
-- Internal helpers (not callable by clients)
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _game_days_total(p_game games)
RETURNS INTEGER LANGUAGE sql IMMUTABLE
AS $$ SELECT GREATEST(1, CEIL(p_game.duration_hours / 24.0)::INTEGER); $$;

CREATE OR REPLACE FUNCTION _game_current_day(p_game games)
RETURNS INTEGER LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN p_game.started_at IS NULL THEN 0
    ELSE LEAST(
      _game_days_total(p_game),
      FLOOR(EXTRACT(EPOCH FROM (NOW() - p_game.started_at)) / 86400)::INTEGER + 1
    )
  END;
$$;

CREATE OR REPLACE FUNCTION _agent_name(p_user_id UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT NULLIF(full_name, '') FROM user_profiles WHERE user_id = p_user_id LIMIT 1),
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = p_user_id),
    'Unknown agent'
  );
$$;

-- Issue every surviving agent their missing daily words, up to today.
CREATE OR REPLACE FUNCTION _grant_daily_words(p_game_id INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_game games;
  v_day INTEGER;
  v_agent RECORD;
  v_word word_bank;
BEGIN
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  IF v_game.status <> 'active' THEN RETURN; END IF;

  FOR v_day IN 1.._game_current_day(v_game) LOOP
    FOR v_agent IN
      SELECT ug.user_id FROM user_games ug
      WHERE ug.game_id = p_game_id AND ug.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM agent_words aw
          WHERE aw.game_id = p_game_id AND aw.issued_to = ug.user_id AND aw.granted_day = v_day
        )
    LOOP
      -- Prefer the day's tier; fall back to any unused word if that tier is exhausted.
      SELECT * INTO v_word FROM word_bank wb
      WHERE NOT EXISTS (SELECT 1 FROM agent_words aw WHERE aw.game_id = p_game_id AND aw.word = wb.word)
      ORDER BY (wb.difficulty = LEAST(3, v_day)) DESC, random()
      LIMIT 1;

      IF v_word.id IS NOT NULL THEN
        INSERT INTO agent_words (game_id, user_id, word, difficulty, granted_day, issued_to)
        VALUES (p_game_id, v_agent.user_id, v_word.word, v_word.difficulty, v_day, v_agent.user_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION _finish_game(p_game_id INTEGER, p_reason TEXT, p_winner UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_game games;
BEGIN
  UPDATE games
  SET status = 'ended', ended_at = NOW(), completion_reason = p_reason, updated_at = NOW()
  WHERE id = p_game_id AND status = 'active'
  RETURNING * INTO v_game;
  IF v_game.id IS NULL THEN RETURN; END IF;

  UPDATE assignments SET status = 'void', resolved_at = NOW()
  WHERE game_id = p_game_id AND status = 'active';
  UPDATE eliminations SET confirmation_status = 'expired'
  WHERE game_id = p_game_id AND confirmation_status = 'pending';

  INSERT INTO game_results (
    game_id, winner_user_id, final_standings, game_duration_hours, total_eliminations, completion_reason
  )
  SELECT
    p_game_id,
    p_winner,
    COALESCE(jsonb_agg(s ORDER BY s.survived DESC, s.eliminations DESC, s.eliminated_at DESC NULLS FIRST), '[]'::jsonb),
    GREATEST(0, ROUND(EXTRACT(EPOCH FROM (NOW() - v_game.started_at)) / 3600))::INTEGER,
    (SELECT COUNT(*) FROM eliminations e WHERE e.game_id = p_game_id AND e.confirmation_status = 'confirmed'),
    p_reason
  FROM (
    SELECT
      ug.user_id,
      (ug.status = 'active') AS survived,
      ug.eliminated_at,
      (SELECT COUNT(*) FROM eliminations e
       WHERE e.game_id = p_game_id AND e.killer_user_id = ug.user_id
         AND e.confirmation_status = 'confirmed') AS eliminations
    FROM user_games ug WHERE ug.game_id = p_game_id
  ) s
  ON CONFLICT (game_id) DO NOTHING;
END;
$$;

-- Bring a game up to date: end it if time ran out, otherwise issue today's words.
CREATE OR REPLACE FUNCTION _sync_game(p_game_id INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_game games;
BEGIN
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  IF v_game.status <> 'active' THEN RETURN; END IF;

  IF NOW() >= v_game.started_at + make_interval(hours => v_game.duration_hours) THEN
    PERFORM _finish_game(p_game_id, 'time_up', NULL);
  ELSE
    PERFORM _grant_daily_words(p_game_id);
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- Client-callable functions
-- ---------------------------------------------------------------------------------------------

-- Host starts the operation: random circular target chain and day-1 words.
CREATE OR REPLACE FUNCTION start_game(p_game_id INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_game games;
  v_players UUID[];
  v_count INTEGER;
  i INTEGER;
BEGIN
  SELECT * INTO v_game FROM games WHERE id = p_game_id FOR UPDATE;
  IF v_game.id IS NULL THEN RAISE EXCEPTION 'Game not found'; END IF;
  IF v_game.host_user_id <> auth.uid() THEN RAISE EXCEPTION 'Only the host can start the operation'; END IF;
  IF v_game.status <> 'lobby' THEN RAISE EXCEPTION 'The operation has already started'; END IF;

  SELECT array_agg(user_id ORDER BY random()) INTO v_players
  FROM user_games WHERE game_id = p_game_id AND status = 'active';
  v_count := COALESCE(array_length(v_players, 1), 0);
  IF v_count < 2 THEN RAISE EXCEPTION 'At least 2 agents are needed to start'; END IF;

  FOR i IN 1..v_count LOOP
    INSERT INTO assignments (game_id, assassin_user_id, target_user_id, round, status)
    VALUES (p_game_id, v_players[i], v_players[(i % v_count) + 1], 1, 'active');
  END LOOP;

  UPDATE games SET status = 'active', started_at = NOW(), updated_at = NOW() WHERE id = p_game_id;
  PERFORM _grant_daily_words(p_game_id);
END;
$$;

-- Everything one agent may see about their operation, as JSON.
CREATE OR REPLACE FUNCTION my_mission(p_game_id INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_me UUID := auth.uid();
  v_membership user_games;
  v_game games;
  v_target UUID;
  v_result JSONB;
BEGIN
  SELECT * INTO v_membership FROM user_games WHERE game_id = p_game_id AND user_id = v_me;
  IF v_membership.id IS NULL THEN RAISE EXCEPTION 'You are not in this operation'; END IF;

  PERFORM _sync_game(p_game_id);
  SELECT * INTO v_game FROM games WHERE id = p_game_id;
  SELECT * INTO v_membership FROM user_games WHERE id = v_membership.id;

  SELECT target_user_id INTO v_target FROM assignments
  WHERE game_id = p_game_id AND assassin_user_id = v_me AND status = 'active'
  ORDER BY id DESC LIMIT 1;

  v_result := jsonb_build_object(
    'game', jsonb_build_object(
      'id', v_game.id,
      'name', v_game.name,
      'code', v_game.code,
      'status', v_game.status,
      'host_user_id', v_game.host_user_id,
      'started_at', v_game.started_at,
      'ended_at', v_game.ended_at,
      'ends_at', v_game.started_at + make_interval(hours => v_game.duration_hours),
      'duration_hours', v_game.duration_hours,
      'completion_reason', v_game.completion_reason,
      'day', _game_current_day(v_game),
      'days_total', _game_days_total(v_game)
    ),
    'me', jsonb_build_object(
      'user_id', v_me,
      'role', v_membership.role,
      'status', v_membership.status,
      'eliminated_at', v_membership.eliminated_at
    ),
    'target', CASE WHEN v_target IS NULL THEN NULL ELSE jsonb_build_object(
      'user_id', v_target,
      'full_name', _agent_name(v_target)
    ) END,
    'words', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'word', aw.word,
        'difficulty', aw.difficulty,
        'granted_day', aw.granted_day,
        'inherited_from_name', CASE WHEN aw.inherited_from IS NULL THEN NULL ELSE _agent_name(aw.inherited_from) END
      ) ORDER BY aw.created_at, aw.id)
      FROM agent_words aw WHERE aw.game_id = p_game_id AND aw.user_id = v_me
    ), '[]'::jsonb),
    'agents_left', (SELECT COUNT(*) FROM user_games WHERE game_id = p_game_id AND status = 'active'),
    'agents_total', (SELECT COUNT(*) FROM user_games WHERE game_id = p_game_id),
    'incoming', (
      SELECT jsonb_build_object(
        'elimination_id', e.id, 'killer_name', _agent_name(e.killer_user_id),
        'word', e.word, 'notes', e.notes, 'occurred_at', e.occurred_at
      )
      FROM eliminations e
      WHERE e.game_id = p_game_id AND e.victim_user_id = v_me AND e.confirmation_status = 'pending'
      ORDER BY e.id DESC LIMIT 1
    ),
    'outgoing', (
      SELECT jsonb_build_object(
        'elimination_id', e.id, 'victim_name', _agent_name(e.victim_user_id),
        'word', e.word, 'occurred_at', e.occurred_at
      )
      FROM eliminations e
      WHERE e.game_id = p_game_id AND e.killer_user_id = v_me AND e.confirmation_status = 'pending'
      ORDER BY e.id DESC LIMIT 1
    ),
    'eliminated_by', (
      SELECT jsonb_build_object(
        'killer_name', _agent_name(e.killer_user_id), 'word', e.word, 'occurred_at', e.occurred_at
      )
      FROM eliminations e
      WHERE e.game_id = p_game_id AND e.victim_user_id = v_me AND e.confirmation_status = 'confirmed'
      ORDER BY e.id DESC LIMIT 1
    ),
    'winner', (
      SELECT jsonb_build_object('user_id', gr.winner_user_id, 'full_name', _agent_name(gr.winner_user_id))
      FROM game_results gr WHERE gr.game_id = p_game_id AND gr.winner_user_id IS NOT NULL
    )
  );
  RETURN v_result;
END;
$$;

-- Roster and kill feed for anyone in the operation. Codewords in the feed are only shown to the
-- killer and the victim; everyone else would otherwise learn a word the killer still holds.
CREATE OR REPLACE FUNCTION game_board(p_game_id INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_me UUID := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_games WHERE game_id = p_game_id AND user_id = v_me) THEN
    RAISE EXCEPTION 'You are not in this operation';
  END IF;
  PERFORM _sync_game(p_game_id);

  RETURN jsonb_build_object(
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', ug.user_id,
        'full_name', _agent_name(ug.user_id),
        'role', ug.role,
        'status', ug.status,
        'joined_at', ug.joined_at,
        'eliminated_at', ug.eliminated_at,
        'eliminations', (
          SELECT COUNT(*) FROM eliminations e
          WHERE e.game_id = p_game_id AND e.killer_user_id = ug.user_id
            AND e.confirmation_status = 'confirmed'
        )
      ) ORDER BY ug.joined_at)
      FROM user_games ug WHERE ug.game_id = p_game_id
    ), '[]'::jsonb),
    'feed', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'elimination_id', e.id,
        'killer_user_id', e.killer_user_id,
        'killer_name', _agent_name(e.killer_user_id),
        'victim_user_id', e.victim_user_id,
        'victim_name', _agent_name(e.victim_user_id),
        'word', CASE WHEN v_me IN (e.killer_user_id, e.victim_user_id) THEN e.word ELSE NULL END,
        'occurred_at', e.occurred_at
      ) ORDER BY e.occurred_at DESC)
      FROM eliminations e
      WHERE e.game_id = p_game_id AND e.confirmation_status = 'confirmed'
    ), '[]'::jsonb)
  );
END;
$$;

-- An agent claims they got their target to say one of their words.
CREATE OR REPLACE FUNCTION report_elimination(p_game_id INTEGER, p_word TEXT, p_notes TEXT DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_me UUID := auth.uid();
  v_assignment assignments;
  v_id INTEGER;
BEGIN
  PERFORM 1 FROM games WHERE id = p_game_id FOR UPDATE;
  PERFORM _sync_game(p_game_id);

  IF NOT EXISTS (SELECT 1 FROM games WHERE id = p_game_id AND status = 'active') THEN
    RAISE EXCEPTION 'The operation is not active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM user_games WHERE game_id = p_game_id AND user_id = v_me AND status = 'active') THEN
    RAISE EXCEPTION 'You are out of this operation';
  END IF;

  SELECT * INTO v_assignment FROM assignments
  WHERE game_id = p_game_id AND assassin_user_id = v_me AND status = 'active'
  ORDER BY id DESC LIMIT 1;
  IF v_assignment.id IS NULL THEN RAISE EXCEPTION 'You have no target'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM agent_words WHERE game_id = p_game_id AND user_id = v_me AND lower(word) = lower(p_word)
  ) THEN
    RAISE EXCEPTION 'That is not one of your codewords';
  END IF;

  IF EXISTS (
    SELECT 1 FROM eliminations
    WHERE game_id = p_game_id AND killer_user_id = v_me AND confirmation_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a report waiting for confirmation';
  END IF;

  INSERT INTO eliminations (
    game_id, assignment_id, killer_user_id, victim_user_id, word, notes,
    confirmation_required, confirmation_status, elimination_round
  )
  VALUES (
    p_game_id, v_assignment.id, v_me, v_assignment.target_user_id, lower(p_word), NULLIF(p_notes, ''),
    TRUE, 'pending', v_assignment.round
  )
  RETURNING id INTO v_id;

  INSERT INTO elimination_confirmations (elimination_id, target_user_id)
  VALUES (v_id, v_assignment.target_user_id);

  RETURN v_id;
END;
$$;

-- The target confirms ("I said it") or disputes a report against them.
CREATE OR REPLACE FUNCTION respond_to_elimination(
  p_elimination_id INTEGER, p_confirmed BOOLEAN, p_note TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_me UUID := auth.uid();
  v_elim eliminations;
  v_victim_assignment assignments;
  v_killer_assignment assignments;
BEGIN
  SELECT * INTO v_elim FROM eliminations WHERE id = p_elimination_id;
  IF v_elim.id IS NULL THEN RAISE EXCEPTION 'Report not found'; END IF;
  PERFORM 1 FROM games WHERE id = v_elim.game_id FOR UPDATE;
  SELECT * INTO v_elim FROM eliminations WHERE id = p_elimination_id;

  IF v_elim.victim_user_id <> v_me THEN RAISE EXCEPTION 'This report is not about you'; END IF;
  IF v_elim.confirmation_status <> 'pending' THEN RAISE EXCEPTION 'This report was already settled'; END IF;

  UPDATE elimination_confirmations
  SET confirmed_at = CASE WHEN p_confirmed THEN NOW() ELSE NULL END,
      confirmation_notes = CASE WHEN p_confirmed THEN NULLIF(p_note, '') ELSE NULL END,
      rejection_reason = CASE WHEN p_confirmed THEN NULL ELSE COALESCE(NULLIF(p_note, ''), 'Disputed') END,
      updated_at = NOW()
  WHERE elimination_id = v_elim.id AND target_user_id = v_me;

  IF NOT p_confirmed THEN
    UPDATE eliminations SET confirmation_status = 'rejected' WHERE id = v_elim.id;
    RETURN;
  END IF;

  UPDATE eliminations SET confirmation_status = 'confirmed', occurred_at = NOW() WHERE id = v_elim.id;
  UPDATE user_games SET status = 'eliminated', eliminated_at = NOW()
  WHERE game_id = v_elim.game_id AND user_id = v_me;

  -- The victim's own claim, if any, dies with them.
  UPDATE eliminations SET confirmation_status = 'expired'
  WHERE game_id = v_elim.game_id AND killer_user_id = v_me AND confirmation_status = 'pending';

  -- The killer inherits the victim's words...
  UPDATE agent_words SET user_id = v_elim.killer_user_id, inherited_from = v_me
  WHERE game_id = v_elim.game_id AND user_id = v_me;

  -- ...and the victim's target.
  SELECT * INTO v_killer_assignment FROM assignments
  WHERE game_id = v_elim.game_id AND assassin_user_id = v_elim.killer_user_id AND status = 'active'
  ORDER BY id DESC LIMIT 1;
  SELECT * INTO v_victim_assignment FROM assignments
  WHERE game_id = v_elim.game_id AND assassin_user_id = v_me AND status = 'active'
  ORDER BY id DESC LIMIT 1;

  UPDATE assignments SET status = 'succeeded', resolved_at = NOW() WHERE id = v_killer_assignment.id;
  UPDATE assignments SET status = 'reassigned', resolved_at = NOW() WHERE id = v_victim_assignment.id;

  IF v_victim_assignment.target_user_id IS NULL
     OR v_victim_assignment.target_user_id = v_elim.killer_user_id THEN
    PERFORM _finish_game(v_elim.game_id, 'last_agent_standing', v_elim.killer_user_id);
  ELSE
    INSERT INTO assignments (game_id, assassin_user_id, target_user_id, round, status)
    VALUES (
      v_elim.game_id, v_elim.killer_user_id, v_victim_assignment.target_user_id,
      v_killer_assignment.round + 1, 'active'
    );
  END IF;
END;
$$;

-- Host ends the operation early.
CREATE OR REPLACE FUNCTION end_game(p_game_id INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM 1 FROM games WHERE id = p_game_id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM games WHERE id = p_game_id AND host_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only the host can end the operation';
  END IF;
  PERFORM _finish_game(p_game_id, 'host_ended', NULL);
END;
$$;

-- Only the client-facing functions are callable by signed-in users.
REVOKE EXECUTE ON FUNCTION
  _game_days_total(games), _game_current_day(games), _agent_name(UUID),
  _grant_daily_words(INTEGER), _finish_game(INTEGER, TEXT, UUID), _sync_game(INTEGER),
  start_game(INTEGER), my_mission(INTEGER), game_board(INTEGER),
  report_elimination(INTEGER, TEXT, TEXT), respond_to_elimination(INTEGER, BOOLEAN, TEXT),
  end_game(INTEGER)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  start_game(INTEGER), my_mission(INTEGER), game_board(INTEGER),
  report_elimination(INTEGER, TEXT, TEXT), respond_to_elimination(INTEGER, BOOLEAN, TEXT),
  end_game(INTEGER)
TO authenticated;

REVOKE EXECUTE ON FUNCTION
  _game_days_total(games), _game_current_day(games), _agent_name(UUID),
  _grant_daily_words(INTEGER), _finish_game(INTEGER, TEXT, UUID), _sync_game(INTEGER)
FROM authenticated;
