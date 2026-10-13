-- Local-only seed, applied by `supabase db reset`. Hosted projects never run this file.

-- Let the database reach the send-push Edge Function (see migration 009). `kong` is the API
-- gateway's hostname inside the local Docker network, and the key is the fixed service role key
-- every local Supabase stack uses (`supabase status` prints it). A hosted project sets these two
-- secrets to its own URL and key instead; see docs/architecture/push-notifications.md.
SELECT vault.create_secret('http://kong:8000/functions/v1', 'codeword_functions_url');
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  'codeword_service_role_key'
);
