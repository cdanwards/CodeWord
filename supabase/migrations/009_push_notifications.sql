-- Migration: push notifications
--
-- Game events write rows to a `notifications` outbox from triggers on the engine tables, so the
-- engine functions in 005 stay unaware of delivery. Inserting into the outbox pokes the
-- `send-push` Edge Function through pg_net, and a once-a-minute pg_cron job retries anything
-- still unsent. The same job brings active games up to date, so daily words are issued and
-- timed-out operations end even when nobody has the app open.
--
-- Agents are not told about things they just did themselves: each trigger skips auth.uid().
--
-- Delivery needs two Vault secrets (seed.sql creates them for the local stack):
--   codeword_functions_url     e.g. https://<ref>.supabase.co/functions/v1
--   codeword_service_role_key  the project's service role key
-- Without them, rows wait in the outbox and nothing is sent.

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ---------------------------------------------------------------------------------------------
-- Device tokens and the outbox
-- ---------------------------------------------------------------------------------------------
CREATE TABLE push_tokens (
  -- Expo push token, e.g. ExponentPushToken[xxxxxxxx]
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
-- No policies: register_push_token / unregister_push_token below are the only way in.

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  -- agent_joined, game_started, word_issued, report_incoming, report_confirmed,
  -- report_disputed, game_over
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- set by claim_push_batch while a send is in flight
  claimed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  attempts SMALLINT NOT NULL DEFAULT 0,
  last_error TEXT
);
CREATE INDEX idx_notifications_unsent ON notifications(id) WHERE sent_at IS NULL;
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------------------------
-- Client-callable: register this device for the signed-in agent
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION register_push_token(p_token TEXT, p_platform TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF p_token IS NULL OR length(p_token) NOT BETWEEN 10 AND 255 THEN
    RAISE EXCEPTION 'Invalid push token';
  END IF;

  -- A device that changes hands moves to the agent now signed in on it.
  INSERT INTO push_tokens (token, user_id, platform)
  VALUES (p_token, auth.uid(), p_platform)
  ON CONFLICT (token) DO UPDATE
    SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION unregister_push_token(p_token TEXT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  DELETE FROM push_tokens WHERE token = p_token AND user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------------------------
-- Delivery: hand the outbox to the send-push Edge Function
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _dispatch_push()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'codeword_functions_url';
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'codeword_service_role_key';
  IF v_url IS NULL OR v_key IS NULL THEN RETURN; END IF;

  -- pg_net queues the request and sends it after this transaction commits, so the function
  -- sees the new rows.
  PERFORM net.http_post(
    url := rtrim(v_url, '/') || '/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
EXCEPTION WHEN OTHERS THEN
  -- Never let delivery problems break a game action; the cron job retries.
  RAISE WARNING 'push dispatch failed: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION _dispatch_push_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM _dispatch_push();
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_dispatch_push
  AFTER INSERT ON notifications
  FOR EACH STATEMENT EXECUTE FUNCTION _dispatch_push_after_insert();

-- Called by the Edge Function with the service role: lock a batch of unsent rows and return
-- them with their recipients' device tokens. A claim older than two minutes is treated as a
-- crashed send and can be claimed again; after five attempts a row is given up on.
CREATE OR REPLACE FUNCTION claim_push_batch(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id BIGINT, user_id UUID, game_id INTEGER, kind TEXT, title TEXT, body TEXT, tokens TEXT[]
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  WITH batch AS (
    SELECT n.id FROM notifications n
    WHERE n.sent_at IS NULL AND n.attempts < 5
      AND (n.claimed_at IS NULL OR n.claimed_at < NOW() - INTERVAL '2 minutes')
    ORDER BY n.id
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE notifications n
    SET claimed_at = NOW(), attempts = n.attempts + 1
    FROM batch WHERE n.id = batch.id
    RETURNING n.*
  )
  SELECT
    c.id, c.user_id, c.game_id, c.kind, c.title, c.body,
    COALESCE((SELECT array_agg(pt.token) FROM push_tokens pt WHERE pt.user_id = c.user_id), '{}')
  FROM claimed c
  ORDER BY c.id;
$$;

-- ---------------------------------------------------------------------------------------------
-- Triggers that write the outbox
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _notify(
  p_user_id UUID, p_game_id INTEGER, p_kind TEXT, p_title TEXT, p_body TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_user_id IS NOT DISTINCT FROM auth.uid() THEN RETURN; END IF;
  INSERT INTO notifications (user_id, game_id, kind, title, body)
  VALUES (p_user_id, p_game_id, p_kind, p_title, p_body);
END;
$$;

-- A recruit joins the lobby: tell the host.
CREATE OR REPLACE FUNCTION _notify_on_join()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_game games;
BEGIN
  SELECT * INTO v_game FROM games WHERE id = NEW.game_id;
  IF NEW.role = 'host' OR v_game.host_user_id = NEW.user_id THEN RETURN NULL; END IF;
  PERFORM _notify(
    v_game.host_user_id, v_game.id, 'agent_joined', 'New recruit',
    format('%s joined %s.', _agent_name(NEW.user_id), v_game.name)
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_notify_on_join
  AFTER INSERT ON user_games
  FOR EACH ROW EXECUTE FUNCTION _notify_on_join();

-- The host starts the operation: tell everyone else.
CREATE OR REPLACE FUNCTION _notify_on_start()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_member RECORD;
BEGIN
  FOR v_member IN SELECT user_id FROM user_games WHERE game_id = NEW.id LOOP
    PERFORM _notify(
      v_member.user_id, NEW.id, 'game_started', 'Operation live',
      format('%s has started. Your target and first codeword are waiting.', NEW.name)
    );
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_notify_on_start
  AFTER UPDATE OF status ON games
  FOR EACH ROW
  WHEN (OLD.status = 'lobby' AND NEW.status = 'active')
  EXECUTE FUNCTION _notify_on_start();

-- A new day's word lands in an arsenal. Day 1 words arrive with the start notice instead, and
-- inherited words move by UPDATE, so they don't fire this.
CREATE OR REPLACE FUNCTION _notify_on_word()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_game games;
BEGIN
  SELECT * INTO v_game FROM games WHERE id = NEW.game_id;
  PERFORM _notify(
    NEW.user_id, NEW.game_id, 'word_issued', 'New codeword',
    format('Day %s of %s: one more word is in your arsenal.', NEW.granted_day, v_game.name)
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_notify_on_word
  AFTER INSERT ON agent_words
  FOR EACH ROW
  WHEN (NEW.granted_day > 1)
  EXECUTE FUNCTION _notify_on_word();

-- A kill report names the target: tell them so they can confirm or dispute.
CREATE OR REPLACE FUNCTION _notify_on_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM _notify(
    NEW.victim_user_id, NEW.game_id, 'report_incoming', 'You''ve been made',
    format('%s says you said a codeword. Confirm or dispute it.', _agent_name(NEW.killer_user_id))
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_notify_on_report
  AFTER INSERT ON eliminations
  FOR EACH ROW
  WHEN (NEW.confirmation_status = 'pending')
  EXECUTE FUNCTION _notify_on_report();

-- The target answers: tell the killer. Deferred to commit so a final kill, which ends the game
-- in the same transaction, is announced once by the game-over notice instead.
CREATE OR REPLACE FUNCTION _notify_on_verdict()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.confirmation_status = 'confirmed' THEN
    IF EXISTS (SELECT 1 FROM games WHERE id = NEW.game_id AND status = 'active') THEN
      PERFORM _notify(
        NEW.killer_user_id, NEW.game_id, 'report_confirmed', 'Kill confirmed',
        format('%s is out. Their codewords and their target are yours now.', _agent_name(NEW.victim_user_id))
      );
    END IF;
  ELSIF NEW.confirmation_status = 'rejected' THEN
    PERFORM _notify(
      NEW.killer_user_id, NEW.game_id, 'report_disputed', 'Report disputed',
      format('%s disputed your report. The hunt is still on.', _agent_name(NEW.victim_user_id))
    );
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trigger_notify_on_verdict
  AFTER UPDATE OF confirmation_status ON eliminations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  WHEN (OLD.confirmation_status = 'pending' AND NEW.confirmation_status IN ('confirmed', 'rejected'))
  EXECUTE FUNCTION _notify_on_verdict();

-- The operation ends (last agent standing, time up, or the host closed it): tell everyone.
CREATE OR REPLACE FUNCTION _notify_on_result()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_game games;
  v_member RECORD;
  v_body TEXT;
BEGIN
  SELECT * INTO v_game FROM games WHERE id = NEW.game_id;

  v_body := CASE
    WHEN NEW.winner_user_id IS NOT NULL THEN
      format('%s is the last agent standing in %s.', _agent_name(NEW.winner_user_id), v_game.name)
    WHEN NEW.completion_reason = 'time_up' THEN
      format('Time ran out on %s. The debrief is ready.', v_game.name)
    ELSE
      format('The host closed %s. The debrief is ready.', v_game.name)
  END;

  FOR v_member IN SELECT user_id FROM user_games WHERE game_id = NEW.game_id LOOP
    IF v_member.user_id = NEW.winner_user_id THEN
      PERFORM _notify(
        v_member.user_id, NEW.game_id, 'game_over', 'You won',
        format('You are the last agent standing in %s.', v_game.name)
      );
    ELSE
      PERFORM _notify(v_member.user_id, NEW.game_id, 'game_over', 'Operation over', v_body);
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_notify_on_result
  AFTER INSERT ON game_results
  FOR EACH ROW EXECUTE FUNCTION _notify_on_result();

-- ---------------------------------------------------------------------------------------------
-- Once a minute: bring active games up to date, then retry the outbox
-- ---------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _tick()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_game_id INTEGER;
BEGIN
  FOR v_game_id IN SELECT id FROM games WHERE status = 'active' LOOP
    -- Skip a game another transaction is busy with; the next tick will get it.
    PERFORM 1 FROM games WHERE id = v_game_id FOR UPDATE SKIP LOCKED;
    IF FOUND THEN
      PERFORM _sync_game(v_game_id);
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM notifications
    WHERE sent_at IS NULL AND attempts < 5
      AND (claimed_at IS NULL OR claimed_at < NOW() - INTERVAL '2 minutes')
  ) THEN
    PERFORM _dispatch_push();
  END IF;
END;
$$;

SELECT cron.schedule('codeword-tick', '* * * * *', 'SELECT public._tick()');

-- ---------------------------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION
  register_push_token(TEXT, TEXT), unregister_push_token(TEXT), _dispatch_push(),
  _dispatch_push_after_insert(), claim_push_batch(INTEGER),
  _notify(UUID, INTEGER, TEXT, TEXT, TEXT), _notify_on_join(), _notify_on_start(),
  _notify_on_word(), _notify_on_report(), _notify_on_verdict(), _notify_on_result(), _tick()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION register_push_token(TEXT, TEXT), unregister_push_token(TEXT)
TO authenticated;

GRANT EXECUTE ON FUNCTION claim_push_batch(INTEGER) TO service_role;
