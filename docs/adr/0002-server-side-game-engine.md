# ADR 0002: Server-side game engine

- Status: accepted
- Date: 2026-10-08
- Implemented in: `supabase/migrations/005_game_engine.sql`, `008_lock_down_engine_tables.sql`

## Context

The September 2025 elimination system wrote game state from the client (`db.attemptElimination`, `db.confirmElimination`) and relied on triggers from migration 004 to assign and reassign targets. It never worked end to end:

- Status values in the triggers and app (`active`, `ended`) violated the table constraints, so starting a game rolled back.
- Row-level security only let players see their own membership, so the start trigger (running as the host) counted one player and created no assignments, and a player could not read their own target.
- Non-host players could not insert eliminations, and the target could not record a confirmation.
- The reassignment trigger cross-joined every player instead of passing the victim's target to the killer.
- Broad read policies let any player read the whole target chain and the codeword used in each kill.

Two fixes were possible: loosen RLS until the client writes worked, or move the rules to the server.

## Decision

Every game action is a `SECURITY DEFINER` Postgres function that checks `auth.uid()` itself, locks the game row, and changes all affected rows in one transaction:

| Function | Who may call | Does |
|---|---|---|
| `start_game(game)` | host, lobby, 2+ agents | Shuffles agents into one circular target chain, issues day-1 words |
| `my_mission(game)` | any member | Returns everything that agent may see (target, words, pending reports, outcome) |
| `game_board(game)` | any member | Roster and kill feed (codewords hidden except from killer and victim) |
| `report_elimination(game, word, notes)` | active agent with a target | Files a pending report; word must be one of theirs; one pending report at a time |
| `respond_to_elimination(report, confirmed, note)` | the reported victim | Dispute voids it. Confirm eliminates the victim, gives the killer the victim's words and target, ends the game if one agent remains |
| `end_game(game)` | host | Ends early |

Clients have no direct access to `assignments`, `eliminations`, `elimination_confirmations` or `agent_words` (beyond reading their own words), and cannot edit memberships.

Time-based rules (one new codeword per day, the time limit) are applied lazily by `_sync_game` at the start of the read and report functions, instead of by a scheduler. The game is correct whenever anyone looks at it, with no cron to run.

## Game rules this encodes (decided 2026-10-08)

- Each agent holds a growing set of codewords. Any of them counts.
- One new word per day from a shared bank: hard on day 1, medium on day 2, easy from day 3.
- Targets confirm or dispute kill reports.
- The killer inherits the victim's target and words. If the inherited target is the killer, they are the last agent standing.
- The host plays like everyone else.

## Consequences

- Rules live in one place and can't be bypassed by a modified client. `scripts/simulate-game.mjs` checks them with real signed-in agents.
- Changing a rule means a new migration, not an app release.
- Clients poll `my_mission` and `game_board` (every 8 seconds on the game screen). Supabase Realtime could replace polling later; the functions would stay the same.
- Function results are JSON, so their TypeScript types (`Mission`, `Board` in `supabase/schema.ts`) must be kept in sync by hand.
