# Plan: Server-side game engine (start, eliminate, confirm)

Status: DONE 2026-10-08 as `supabase/migrations/005_game_engine.sql` + `006_word_bank.sql`, verified by `scripts/simulate-game.mjs`. Rules were settled with Dan: daily words from a shared bank (hard → easy), killer inherits the victim's words and target, target confirms, host plays. Kept below for the reasoning.

## Problem

The game loop (start game → targets assigned → claim elimination → target confirms → eliminator inherits target) cannot work against the current database. It was written in Sept 2025 (migration `004_elimination_confirmations.sql` plus `db.attemptElimination`/`confirmElimination`) and never run end to end. Verified against a fresh `supabase start`:

### Constraint mismatches
- `assignments.status` allows `pending|succeeded|reassigned|failed`, but the triggers insert `'active'` and `getMyTarget` filters on `'active'`. Starting a game with 2+ players makes `initialize_game_assignments` fail, which rolls back the `games` update.
- `games.status` allows `lobby|active|finished|canceled`, but `endGame`, `reassign_targets_after_elimination`, `check_game_completion` and the UI (`StatusPill`) use `'ended'`.

### RLS blocks the players who perform each step
- `eliminations` INSERT/UPDATE is host-only, so a non-host killer cannot claim an elimination and a target cannot confirm one.
- `elimination_confirmations` INSERT requires `auth.uid() = target_user_id`, so the killer cannot create the target's confirmation row.
- `user_games` SELECT is own-row only:
  - the lobby member list shows only yourself
  - `getMyTarget` cannot read the target's row
  - `initialize_game_assignments` (SECURITY INVOKER, run as the host) counts 1 player and creates no assignments.
- All triggers are SECURITY INVOKER, so they inherit those limits.

### Wrong game rule
`reassign_targets_after_elimination` cross-joins all active players into a new "round", producing N×(N−1) assignments. The spec (`specs/design.md`: "eliminator inherits eliminated player's target") wants a chain: when B (A's target) is confirmed eliminated, A's assignment → `succeeded`, B's assignment (B→C) → `reassigned`, insert A→C `active`. When A's new target is A itself, A wins.

## Proposed fix (migration 005)

Make each game action one authoritative, atomic server-side operation. Don't loosen RLS for it.

1. Fix constraints: allow `'active'` on `assignments.status` and `'ended'` on `games.status` (or rename to `finished` everywhere; pick one).
2. Add a `SECURITY DEFINER` helper `is_game_member(game_id)` and use it for a "members can view memberships in their games" policy on `user_games`. That fixes the lobby list and target lookup without recursive RLS.
3. Replace the trigger logic with `SECURITY DEFINER` RPCs that check `auth.uid()` themselves:
   - `start_game(game_id)`: host only, status `lobby`, at least 2 players. Shuffle players into a circular chain, insert round-1 assignments (optionally attaching a `game_words` word), set `active`.
   - `claim_elimination(game_id, notes)`: caller must have an active assignment. Insert a pending `eliminations` row plus the target's `elimination_confirmations` row.
   - `respond_to_elimination(elimination_id, confirmed, notes)`: caller must be the victim. On confirm, mark the victim eliminated, apply the chain inheritance above, and end the game when one player remains.
4. Drop `trigger_initialize_game_assignments`, `trigger_reassign_targets_after_elimination` and `trigger_check_game_completion`; the RPCs own that logic.
5. Client: `db.startGame`, `db.attemptElimination` and `db.confirmElimination` call `supabase.rpc(...)`.
6. Verify with a node script that signs in 3 local users and plays a full game to completion, and add it as an integration test.

## Open questions for Dan
- Word rules: one word per assignment, per day (`game_words.day_number`), or per game?
- Keep the target-confirms step, or let a claim count immediately with a dispute window?
- Should the host also be a player? Current code makes the host a member with role `host`, so yes.
