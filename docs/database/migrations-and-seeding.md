# Migrations and seeding

## The migrations

Applied in filename order by the Supabase CLI.

| File | What it does |
|---|---|
| `001_update_for_supabase_auth.sql` | `user_profiles`, `games`, `user_games` on Supabase Auth; profile-on-signup trigger |
| `002_gameplay_extensions.sql` | Game codes, host, status, duration; `assignments`, `eliminations` |
| `003_games_policies.sql` | Hosts manage their own games |
| `004_elimination_confirmations.sql` | `elimination_confirmations`, `game_results` (its triggers are retired by 005) |
| `005_game_engine.sql` | The game engine: status vocabularies, `word_bank` / `agent_words`, co-player visibility, engine functions |
| `006_word_bank.sql` | Seeds about 150 codewords per difficulty tier |
| `007_timestamptz.sql` | Every timestamp column becomes `timestamptz` |
| `008_lock_down_engine_tables.sql` | Removes direct client access to engine-owned tables; joining, leaving and editing games only in the lobby; game status and clocks engine-only |
| `009_push_notifications.sql` | `push_tokens`, the `notifications` outbox and its triggers, delivery through pg_net to `send-push`, the once-a-minute `codeword-tick` cron job |

`supabase/seed.sql` runs after the migrations on `supabase db reset` (local only). It stores the Vault secrets that let the local database call the `send-push` function.

## Applying them locally

```bash
supabase start                   # first run applies everything to a fresh database
supabase migration up --local    # apply new migrations, keep your data
supabase db reset --local        # wipe and re-apply everything (deletes test accounts too)
```

After a reset, if auth calls return 502 ("An invalid response was received from the upstream server"), the API gateway is still pointing at the old auth container: `docker restart supabase_kong_CodeWord`.

## Writing a migration

1. Add `supabase/migrations/NNN_short_name.sql` with the next number. Never edit a migration that has been applied anywhere else; add a new one.
2. Start with a comment that says why, not just what.
3. If you change a table, update `supabase/schema.ts`. If you change an engine function's JSON, update `Mission` / `Board` in `supabase/schema.ts`.
4. If you add a table, enable RLS and decide its policies explicitly; update [schema and RLS](schema-and-rls.md).
5. Apply it with `supabase migration up --local`, then prove the chain still builds from scratch with `supabase db reset --local`.
6. Run `node scripts/simulate-game.mjs` (it must print all checks passed) and add a check for any new rule or permission. If the change affects notifications, also run `node scripts/push-check.mjs`.

Inspect the database directly with:

```bash
docker exec -it supabase_db_CodeWord psql -U postgres
```

Supabase Studio is at http://127.0.0.1:54323.

## Test data

`seed.sql` holds configuration only; test accounts are made through the real auth API so they behave like users.

- **Fixed test agents:** `alice`, `bob`, `priya`, `dev` (`<name>@codeword.test`, password `codeword-dev-1`). `scripts/agent.mjs` creates each on first use.
- **A ready lobby:**

```bash
node scripts/agent.mjs alice create "Office Showdown"   # prints the code
node scripts/agent.mjs bob join <CODE>
node scripts/agent.mjs priya join <CODE>
node scripts/agent.mjs dev join <CODE>
```

Sign in as Alice in the app and start the operation, then drive the others from the terminal (`mission`, `report`, `confirm`, `dispute`).

- **Throwaway agents:** `scripts/simulate-game.mjs` signs up new `agent-<run>-<n>@codeword.test` users on every run. They accumulate harmlessly; `supabase db reset --local` clears them.

## Deploying

The hosted project is `peuvdwygnzjoexsqildc` ("CodeWord", us-east-2). It was paused while the project sat idle and restored on 2026-10-13, when migrations 004 to 009 were pushed and `send-push` deployed. `.env` holds its URL and anon key, so builds without `.env.local` (EAS builds) use it.

To ship a new migration:

```bash
supabase link --project-ref peuvdwygnzjoexsqildc   # once per checkout
supabase migration list --linked                   # what's applied where
supabase db push --linked --dry-run                # what would be applied
supabase db push --linked
```

After changing `supabase/functions/send-push`, run `supabase functions deploy send-push --project-ref peuvdwygnzjoexsqildc`. Pushes also need the two Vault secrets ([push notifications](../architecture/push-notifications.md#hosted-project)). `seed.sql` is never pushed.

Free-tier projects pause after a week without traffic. If the API answers 521 and the CLI reports "tenant/user not found", restore the project from the dashboard and wait for the pooler to catch up.

Don't point `scripts/simulate-game.mjs` or `scripts/push-check.mjs` at the hosted project; both refuse non-local URLs on purpose.
