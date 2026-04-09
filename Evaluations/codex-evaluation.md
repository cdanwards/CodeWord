# Code Audit Report

## Executive Summary

- Overall health: mixed
- High-priority issues: 2
- Medium-priority issues: 4
- Top priorities:
  - Restrict `games` read access so join codes are not publicly enumerable
  - Stop persisting auth session tokens in MMKV with a hard-coded client key
  - Fix gameplay data modeling so member and join flows behave correctly

## Findings

### High

#### Public game codes are exposed through RLS

- File: [supabase/migrations/001_update_for_supabase_auth.sql](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/supabase/migrations/001_update_for_supabase_auth.sql:71)
- Related: [supabase/migrations/003_games_policies.sql](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/supabase/migrations/003_games_policies.sql:6)
- Issue: `games` has a global `SELECT` policy, and later migrations only add write restrictions. Because the row includes the join `code`, any client using the anon key can read and enumerate invite codes.
- Impact: The intended private invite flow can be bypassed; users can discover active games without being invited.
- Recommendation: Replace the public `SELECT` policy with member/host-scoped access, or move join-code lookup behind a secure RPC/function that returns minimal data.

#### Auth tokens are duplicated into MMKV with a hard-coded encryption key

- File: [src/stores/storage.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/stores/storage.ts:3)
- Related: [src/stores/authStore.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/stores/authStore.ts:224), [src/stores/authStore.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/stores/authStore.ts:252), [supabase/database.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/supabase/database.ts:33)
- Issue: The store persists the auth `session`, including the access token, into MMKV protected by a static literal key. Supabase is already configured to use Secure Store for auth persistence.
- Impact: Bearer tokens are stored twice, stale auth state becomes more likely, and the MMKV copy is not meaningfully protected because the key ships with the app.
- Recommendation: Remove `session` persistence from Zustand, rely on Supabase Secure Store for session management, and only persist non-sensitive UI state.

### Medium

#### Game member list renders the game name instead of user identity

- File: [src/lib/database.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/lib/database.ts:292)
- Related: [src/app/(app)/game/[id].tsx](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/app/(app)/game/[id].tsx:62)
- Issue: `getGameMembers` joins `games (*)` from `user_games`, and the detail screen renders `item.games.name` inside the Members list.
- Impact: The UI cannot show actual participants; every row displays the game name instead of member information.
- Recommendation: Join against `user_profiles` or build a server-side view that returns member identity fields needed by the screen.

#### Duplicate join detection is unreliable due to snake_case/camelCase mismatch

- File: [supabase/schema.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/supabase/schema.ts:48)
- Related: [src/components/JoinGameModal.tsx](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/components/JoinGameModal.tsx:73), [src/screens/GamesScreen.tsx](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/screens/GamesScreen.tsx:110)
- Issue: The app types model `user_games` with camelCase fields like `gameId`, but Supabase responses arrive in snake_case. The duplicate check only reads `ug.gameId`.
- Impact: Existing memberships can be missed, so users get a generic database failure instead of the intended “already joined” message.
- Recommendation: Normalize API responses into app-level types before use, or consistently access the actual wire keys until a mapper layer exists.

#### Signup assumes an immediate authenticated session and verified email

- File: [src/stores/authStore.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/stores/authStore.ts:147)
- Related: [src/stores/authStore.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/stores/authStore.ts:154), [src/screens/SignupScreen.tsx](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/screens/SignupScreen.tsx:67)
- Issue: The code treats `data.user` as a successful logged-in state and hard-codes `emailVerified: true`, then routes directly into the authenticated app.
- Impact: If Supabase email confirmation is enabled or session creation is deferred in any environment, signup will produce an inconsistent auth state and broken navigation.
- Recommendation: Branch on whether a real session exists, surface a “check your email” state when needed, and derive verification from Supabase fields instead of hard-coding it.

#### Coverage is overstated relative to actual system risk

- File: [jest.config.js](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/jest.config.js:2)
- Issue: Jest only reports coverage for files exercised by the current tests because `collectCoverageFrom` is not configured.
- Impact: The reported 88.57% statement coverage masks the absence of tests for auth, routing, Supabase integration, and gameplay flows where most defects currently exist.
- Recommendation: Add `collectCoverageFrom` for `src/**/*.{ts,tsx}` and write focused tests for auth store behavior, route guards, join/create flows, and database mapping logic.

#### Production debug logging is too broad in auth/network flows

- File: [supabase/database.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/supabase/database.ts:11)
- Related: [src/components/AuthProvider.tsx](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/components/AuthProvider.tsx:22), [src/stores/authStore.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/stores/authStore.ts:175), [src/screens/GamesScreen.tsx](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/screens/GamesScreen.tsx:32)
- Issue: Authentication state changes, network state, and environment availability are logged unconditionally across runtime code.
- Impact: Logs become noisy, leak operational details into production telemetry/device logs, and make it harder to isolate real failures.
- Recommendation: Gate verbose logs behind `__DEV__` or a structured logger with environment-level filtering.

## Testing and Tooling Results

- `npm run compile`: passed
- `npm test -- --runInBand`: passed
- `npx jest --coverage --runInBand`: passed
- `npm run lint:check`: failed on one import-order issue in [src/lib/database.ts](/Users/danedwards/.superset/worktrees/CodewordApp/Daniel-Edwards/test-setup/src/lib/database.ts:2)

## Metrics

- Files analyzed: 95 source files under `src/`
- Approximate lines analyzed: 8,425 lines across `src/` and `test/`
- Test files present: 4
- Reported coverage: 88.57% statements, 71.42% branches, 90.9% functions, 88.46% lines

## Prioritized Action Plan

1. Immediate
   Restrict `games` read policies and remove persisted auth tokens from Zustand/MMKV.
2. Short term
   Introduce a response-mapping layer for Supabase data and fix the game detail member query/render path.
3. Short term
   Make signup/session handling environment-safe and remove hard-coded `emailVerified`.
4. Medium term
   Expand test coverage to auth, route guards, and gameplay flows, then enforce meaningful coverage reporting in Jest.

## Assumptions

- This audit assumes join codes are intended to be private invite tokens rather than public discovery data.
- This audit assumes Supabase email confirmation settings may differ across environments.
