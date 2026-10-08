# Schema and row-level security

The migrations in `supabase/migrations/` are the source of truth; `supabase/schema.ts` mirrors them for TypeScript. All timestamps are `timestamptz` (migration 007). Every public table has RLS enabled.

## Tables

| Table | Holds | Written by |
|---|---|---|
| `user_profiles` | One row per auth user: `full_name`, `avatar_url`, `bio` | Signup trigger, the owner |
| `games` | An operation: `name`, `code` (unique, six characters), `host_user_id`, `status`, `duration_hours`, `started_at`, `ended_at`, `completion_reason`, `settings` | Host (create, edit name), engine (status, times) |
| `user_games` | Membership: `role` (`host` / `player`), `status` (`active` / `eliminated` / `left`), `joined_at`, `eliminated_at` | The joining player (insert), engine (status) |
| `assignments` | Target chain: `assassin_user_id` → `target_user_id`, `round`, `status` (`active` / `succeeded` / `reassigned` / `void`) | Engine only |
| `eliminations` | Kill reports: killer, victim, `word`, `notes`, `confirmation_status` (`pending` / `confirmed` / `rejected` / `expired`) | Engine only |
| `elimination_confirmations` | The victim's answer to a report (`confirmed_at` or `rejection_reason`) | Engine only |
| `game_results` | One row per finished game: winner, `final_standings` (JSON), totals, `completion_reason` | Engine only |
| `word_bank` | Shared codewords with `difficulty` 1 (hard) – 3 (easy) | Migration 006 |
| `agent_words` | Each agent's codewords per game: `word`, `difficulty`, `granted_day`, `issued_to` (first holder), `user_id` (current holder), `inherited_from` | Engine only |

Status values: `games.status` is `lobby` → `active` → `ended` (or `canceled`). `completion_reason` is `last_agent_standing`, `time_up` or `host_ended`. See the [glossary](../../specs/glossary.md).

## Engine functions

`SECURITY DEFINER` functions in `005_game_engine.sql` own every game-state change. They check `auth.uid()`, lock the game row (`FOR UPDATE`), and raise readable errors. Only these are executable by signed-in users:

`start_game`, `my_mission`, `game_board`, `report_elimination`, `respond_to_elimination`, `end_game`

Internal helpers (`_sync_game`, `_grant_daily_words`, `_finish_game`, `_agent_name`, `_game_current_day`, `_game_days_total`) are revoked from `anon` and `authenticated`. `_sync_game` runs at the start of `my_mission`, `game_board` and `report_elimination`: it ends the game if time is up, otherwise issues any missing daily words. See [ADR 0002](../adr/0002-server-side-game-engine.md) for the rules.

RLS helpers `is_game_member(game_id)` and `shares_game_with(user_id)` are `SECURITY DEFINER` so policies on `user_games` can refer to `user_games` without recursion.

## Who can do what (as a signed-in client)

| Table | Read | Write |
|---|---|---|
| `user_profiles` | Your own; anyone you share a game with | Insert, update, delete your own |
| `games` | All games (needed for join-by-code; see gaps below) | Open a game as its host, in the lobby only; while it's in the lobby the host may edit `name`, `description`, `duration_hours`, `settings`; the host may delete it. Status, times, code and host are engine-only. |
| `user_games` | Your own; every membership in games you're in | Insert yourself while the game is in the lobby; delete yourself while in the lobby. No updates. |
| `agent_words` | Your own current words | None |
| `game_results` | Results of games you're in | None |
| `assignments`, `eliminations`, `elimination_confirmations`, `word_bank` | None | None |

Signed-out (`anon`) clients get nothing beyond reading `games`.

`scripts/simulate-game.mjs` asserts the important rows of this table: no direct reads of the target chain or kill records, no rewriting assignments or game status as host, no opening a game that's already running, no reviving yourself, no late joins or mid-game leaves, words private.

## Known gaps

- **Game codes are enumerable.** "Anyone can view games" lets any client list every game and its code. Spec `VerifiedSpecs/04-rls-policy-game-codes.md` proposes replacing it with a lookup-by-code function.
- **Profiles are readable by co-players**, including `bio` and `avatar_url`. Fine for now; revisit if profiles grow private fields.
- **Hosts can delete a running game**, which cascades to everything in it.
- **No rate limiting** on reports or joins beyond "one pending report at a time".
