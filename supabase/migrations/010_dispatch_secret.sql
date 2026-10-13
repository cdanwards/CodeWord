-- Migration: the database authenticates to send-push with its own secret
--
-- Migration 009 had the database call send-push with the project's service role key, copied
-- into Vault by hand. That ties delivery to Supabase's key formats (legacy JWT keys are being
-- retired) and puts a key that bypasses RLS somewhere a person has to paste it.
--
-- Instead, this migration generates a random dispatch secret inside Vault. The database sends
-- it in an `x-codeword-dispatch` header, and send-push asks the database whether it matches
-- (check_dispatch_secret). Nobody copies a secret, local and hosted work the same way, and the
-- secret can only make send-push drain the outbox. send-push no longer needs JWT verification
-- (`verify_jwt = false` in config.toml).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'codeword_dispatch_secret') THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'codeword_dispatch_secret',
      'Sent by _dispatch_push to the send-push Edge Function; checked by check_dispatch_secret'
    );
  END IF;
END;
$$;

-- The service role key copied in for 009 is no longer used.
DELETE FROM vault.secrets WHERE name = 'codeword_service_role_key';

CREATE OR REPLACE FUNCTION _dispatch_push()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'codeword_functions_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'codeword_dispatch_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN RETURN; END IF;

  -- pg_net queues the request and sends it after this transaction commits, so the function
  -- sees the new rows.
  PERFORM net.http_post(
    url := rtrim(v_url, '/') || '/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-codeword-dispatch', v_secret
    ),
    body := '{}'::jsonb
  );
EXCEPTION WHEN OTHERS THEN
  -- Never let delivery problems break a game action; the cron job retries.
  RAISE WARNING 'push dispatch failed: %', SQLERRM;
END;
$$;

-- Called by send-push with its service key to check the header it was given.
CREATE OR REPLACE FUNCTION check_dispatch_secret(p_secret TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(p_secret IS NOT NULL AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets
    WHERE name = 'codeword_dispatch_secret' AND decrypted_secret = p_secret
  ), FALSE);
$$;

REVOKE EXECUTE ON FUNCTION _dispatch_push(), check_dispatch_secret(TEXT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_dispatch_secret(TEXT) TO service_role;
