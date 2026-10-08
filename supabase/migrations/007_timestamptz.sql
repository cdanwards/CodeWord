-- Migration: store every timestamp as timestamptz.
--
-- The columns were `timestamp without time zone`, so PostgREST returned values like
-- "2026-10-08T17:55:00" with no zone and the app parsed them as local time (a 72h game showed
-- "75h left"). Existing values were written by NOW() on a UTC server, so read them as UTC.

ALTER TABLE agent_words
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE assignments
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN resolved_at TYPE TIMESTAMPTZ USING resolved_at AT TIME ZONE 'UTC';

ALTER TABLE elimination_confirmations
  ALTER COLUMN confirmed_at TYPE TIMESTAMPTZ USING confirmed_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE eliminations
  ALTER COLUMN confirmation_deadline TYPE TIMESTAMPTZ USING confirmation_deadline AT TIME ZONE 'UTC',
  ALTER COLUMN occurred_at TYPE TIMESTAMPTZ USING occurred_at AT TIME ZONE 'UTC';

ALTER TABLE game_results
  ALTER COLUMN completed_at TYPE TIMESTAMPTZ USING completed_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE games
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN ended_at TYPE TIMESTAMPTZ USING ended_at AT TIME ZONE 'UTC',
  ALTER COLUMN started_at TYPE TIMESTAMPTZ USING started_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE user_games
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN eliminated_at TYPE TIMESTAMPTZ USING eliminated_at AT TIME ZONE 'UTC',
  ALTER COLUMN joined_at TYPE TIMESTAMPTZ USING joined_at AT TIME ZONE 'UTC',
  ALTER COLUMN left_at TYPE TIMESTAMPTZ USING left_at AT TIME ZONE 'UTC',
  ALTER COLUMN played_at TYPE TIMESTAMPTZ USING played_at AT TIME ZONE 'UTC';

ALTER TABLE user_profiles
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
