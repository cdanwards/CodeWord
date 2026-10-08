# Unified Initial Plan: Codebase Hardening + Dependency Upgrades

## Overview

This plan merges the findings from 4 independent codebase evaluations with the Expo SDK 53 → 55 dependency upgrade plan into a single sequenced roadmap. The ordering is deliberate: clean up dead code first (less to migrate), fix security issues (shouldn't wait), upgrade dependencies (on a cleaner codebase), then do structural improvements (on the latest stack).

**Estimated total phases:** 8
**Branch strategy:** Each phase is a separate PR. Phases 4a-4d can run in parallel after Phase 3 merges. Phases 5a-5c can run in parallel.

---

## Phase 1: Pre-Flight & Dead Code Removal

**Goal:** Establish a reliable baseline and reduce upgrade surface area by removing everything that shouldn't be migrated.

**Risk: Low | Effort: < 1 day**

### 1.1 Verify current baseline
```bash
yarn compile && yarn lint:check && yarn test
```
Record results as the "before" snapshot.

### 1.2 Delete dead code & legacy artifacts

| Action | File(s) | Rationale |
|--------|---------|-----------|
| Delete dead auth module | `src/lib/auth.ts` | Never imported; `auth-client.ts` is the real entry point. Flagged by 2/4 evaluators. |
| Delete stale Better Auth docs | `llm-helpers/better_auth.md` (631KB) | Documents a removed system. |
| Delete non-functional test scripts | `test-auth.js`, `test-db.js`, `test-profile.js`, `test-zustand.js` | Plain Node scripts that import RN modules — will never execute. Flagged by 2/4 evaluators. |
| Delete dead seed script | `scripts/seed-users.js` | References dropped Better Auth tables. |
| Remove Better Auth env vars | `.env` → remove `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Stale secrets from previous auth system. |

### 1.3 Fix broken test infrastructure

| Action | File | Rationale |
|--------|------|-----------|
| Fix i18n test path | `test/i18n.test.ts` — change `'./app'` → `'./src/app'` | Currently always passes vacuously (wrong path). |
| Add `collectCoverageFrom` | `jest.config.js` — add `["src/**/*.{ts,tsx}"]` | Reported 88.57% coverage is misleading; only reports on already-exercised files. |

### 1.4 Re-verify baseline
```bash
yarn compile && yarn lint:check && yarn test
```
All existing tests should still pass. Coverage numbers will now reflect reality.

**Commit:** `Clean up dead code, fix test infrastructure baseline`

---

## Phase 2: Critical Fixes (Security + UI Bugs)

**Goal:** Fix all critical and high-severity issues identified by the evaluations before touching dependencies.

**Risk: Medium | Effort: 1-2 days**

### 2.1 Security: MMKV encryption key

**File:** `src/stores/storage.ts`
**Issue:** Hardcoded `"codeword-app-key"` — predictable on jailbroken/decompiled devices.
**Fix:** Generate a random key per-device using `expo-crypto`, store it in `expo-secure-store`, load it at MMKV initialization. Handle first-run key generation vs. subsequent loads.

### 2.2 Security: RLS policy exposes game join codes

**Files:** `supabase/migrations/` (new migration)
**Issue:** Global `SELECT` policy on `games` table lets any authenticated user enumerate all join codes.
**Fix:** Replace the public `SELECT` policy with one scoped to game members and hosts:
```sql
CREATE POLICY "Users can view games they belong to"
ON games FOR SELECT
USING (
  auth.uid() = host_user_id
  OR EXISTS (
    SELECT 1 FROM user_games
    WHERE user_games.game_id = games.id
    AND user_games.user_id = auth.uid()
  )
);
```
Add a separate secure RPC function for join-code lookup that returns minimal data.

### 2.3 Security: Hardcoded emailVerified

**Files:** `src/stores/authStore.ts` (lines 108, 154, 219), `src/components/AuthProvider.tsx` (line 31)
**Issue:** `emailVerified: true` hardcoded in 4 places.
**Fix:** Read from `!!user.email_confirmed_at`. Extract a `mapSupabaseUser()` helper to eliminate the 4x duplication simultaneously.

### 2.4 Security: Duplicate auth token storage

**Files:** `src/stores/authStore.ts`
**Issue:** Session tokens persisted in both MMKV (via Zustand persist) and Supabase's Secure Store adapter — stale token risk.
**Fix:** Remove `session` from the Zustand persisted state. Only persist non-sensitive UI state (e.g., `isAuthenticated` flag for fast startup). Rely on Supabase's Secure Store adapter as the single source of truth for session tokens.

### 2.5 UI: Debug colors in JoinGameModal

**File:** `src/components/JoinGameModal.tsx`
**Issue:** Bright magenta/cyan debug backgrounds will render in production.
**Fix:** Replace with theme colors using `useAppTheme()`.

### 2.6 UI: GameDetailScreen member list shows wrong data

**Files:** `src/lib/database.ts` (`getGameMembers`), `src/app/(app)/game/[id].tsx`
**Issue:** Member list renders `item.games.name` (game name) instead of user name.
**Fix:** Update `getGameMembers` to join against `user_profiles` and render member identity fields.

### 2.7 Data integrity: Join code uniqueness

**Files:** `supabase/migrations/` (new migration), `src/lib/database.ts`
**Issue:** Client-side code generation loop with no atomic guarantee. Flagged by all 4 evaluators.
**Fix:** Add a `UNIQUE` constraint on `games.code` (if not already present at DB level) and add retry-on-collision logic in `createGameHost`. Long-term: move code generation to a database function.

**Commit:** `Fix critical security vulnerabilities and UI bugs`

---

## Phase 3: Expo SDK 53 → 55

**Goal:** Upgrade the core platform. This is the highest-risk phase.

**Risk: High | Effort: 2-3 days**

### 3.1 Run Expo upgrade tool
```bash
npx expo install expo@^55 --fix
```
This auto-updates expo, all expo-* packages, react-native (0.79→0.83), react-native-reanimated (3→4), react-native-gesture-handler, screens, safe-area-context, web, jest-expo, eslint-config-expo, @expo/metro-runtime.

**Risk note:** Reanimated 3→4 is normally high-risk, but this project has zero direct Reanimated imports — only used transitively by `@gorhom/bottom-sheet`.

### 3.2 Manually update remaining pinned packages

All packages listed in the dependency upgrade plan Phase 1b: react, react-dom, @types/react, navigation packages, @gorhom/bottom-sheet, @supabase/supabase-js, apisauce, dotenv, drizzle-orm, zod, zustand, Babel packages, prettier, reactotron packages, ts-jest, @testing-library/react-native, drizzle-kit.

### 3.3 Config file audit

| File | Check |
|------|-------|
| `app.json` | `newArchEnabled` default in RN 0.83+? `jsEngine: "hermes"` still needed? `experiments.*` graduated? |
| `app.config.ts` | `ts-node/register` pattern. `plugins/withSplashScreen.ts` APIs. |
| `metro.config.js` | `resolver.unstable_conditionNames`. `.cjs` extension workaround. |
| `babel.config.js` | `react-native-reanimated/plugin` path in Reanimated v4. |
| `supabase/database.ts` | `react-native-url-polyfill/auto` — may not be needed with RN 0.83 native URL support. |

### 3.4 Clean install + verification
```bash
rm -rf node_modules yarn.lock
yarn install
npx expo install --fix
yarn compile && yarn lint:check && yarn test
npx expo start
```
Manual smoke test: login → home → games → profile → sign out.

**Commit:** `Upgrade Expo SDK 53 → 55 with all pinned dependencies`

---

## Phase 4: Independent Library Upgrades

**Goal:** Upgrade libraries that aren't pinned by Expo. Each is a separate commit.

**Can run in parallel after Phase 3 merges.**

### 4a. react-native-mmkv 3 → 4

**Risk: Medium | Effort: < 1 day**

Files: `src/stores/storage.ts`, `src/utils/storage/index.ts`
Check: `reactotron-react-native-mmkv` compatibility with MMKV v4.
Verify: `yarn test` + manual auth persistence test (kill app, reopen, still logged in).

**Note:** Coordinate with Phase 2.1 (MMKV encryption key fix) — if both change MMKV initialization, merge carefully.

### 4b. @shopify/flash-list 1 → 2

**Risk: Low | Effort: < 0.5 day**

Files: `src/components/ListView.tsx`
Verify: Manual test of Games list screen.

### 4c. i18next 23 → 26

**Risk: Medium-High | Effort: 1-2 days**

Strategy: Upgrade incrementally (23→24→25→26), verifying at each step. Also update `react-i18next`.
Files: `src/i18n/index.ts`, `src/i18n/translate.ts`, `test/setup.ts`, `test/i18n.test.ts`
Verify: `yarn test` + manual check translations render.

### 4d. react-native-url-polyfill 2 → 3 (or remove)

**Risk: Low | Effort: < 0.5 day**

File: `supabase/database.ts` — if RN 0.83 includes native URL support, remove entirely.
Verify: Manual Supabase auth flow test.

---

## Phase 5: Toolchain Upgrades

**Goal:** Upgrade development tooling. Each is a separate commit.

**Can run in parallel. Each is independent.**

### 5a. ESLint 8 → 9+ (Flat Config Migration)

**Risk: Medium | Effort: 1-2 days**

- Delete `.eslintrc.js`, create `eslint.config.mjs`
- Update `eslint-config-prettier` 9→10, `eslint-plugin-react-native` 4→5
- Move `.eslintignore` patterns into flat config
- **Bonus from evaluation:** Re-enable `@typescript-eslint/no-explicit-any` and fix the 27 violations
- Verify: `yarn lint:check` produces same or fewer warnings.

### 5b. TypeScript 5.8 → 6.x (conditional)

**Risk: Medium | Effort: 0.5-1 day**

**Gate:** Only proceed if `expo/tsconfig.base` supports TS 6. If not, defer.
Files: `tsconfig.json`, `test/test-tsconfig.json`
Verify: `yarn compile` with zero errors.

### 5c. Jest 29 → 30 (conditional)

**Risk: Low-Medium | Effort: 0.5-1 day**

**Gate:** Only proceed if `jest-expo@~55` supports Jest 30. If not, defer.
Files: `jest.config.js`, update `@types/jest`, `babel-jest`
Verify: `yarn test` — all tests pass.

---

## Phase 6: Architecture Refactoring

**Goal:** Address the structural issues identified by all 4 evaluators. Done after upgrades so we build on the final stack.

**Risk: Medium | Effort: 3-5 days**

### 6.1 Split the database God Object

**Flagged by: All 4 evaluators**

Split `src/lib/database.ts` (~400 lines) into:
- `src/lib/db/profiles.ts` — user profile CRUD
- `src/lib/db/games.ts` — game creation, joining, listing
- `src/lib/db/assignments.ts` — assignment management
- `src/lib/db/eliminations.ts` — elimination recording
- `src/lib/db/words.ts` — game word management
- `src/lib/db/index.ts` — re-export unified `db` object for backward compatibility

### 6.2 Replace silent error swallowing with typed error returns

**Flagged by: Claude (critical)**

Replace the `catch -> return null` pattern across all `db.*` functions with:
```typescript
type Result<T> = { data: T; error: null } | { data: null; error: string }
```
Update all call sites in screens/stores to handle the error case and show user-facing error messages instead of silent empty states.

### 6.3 Add domain validation layer

**Flagged by: Gemini, Claude**

- Define game status as TypeScript union: `"pending" | "active" | "completed" | "cancelled"`
- Add CHECK constraints via new migration
- Add Zod validation on user inputs before database writes
- Enforce game invariants: can't join a started game, can't eliminate a player not assigned to you, etc.

### 6.4 Consolidate auth state

**Flagged by: Gemini, Copilot**

- Single source of truth for current user session
- Use granular Zustand selectors (`useIsAuthenticated`, `useUser`) instead of `useAuth()` in all screens
- Properly type the Supabase storage adapter (remove `as any`)

### 6.5 Clean up console logging

**Flagged by: 3/4 evaluators (98 calls across 16 files)**

- Gate all debug logs behind `__DEV__`
- Use `src/utils/crashReporting.ts` for production errors
- Remove the `DEV_TEST_NETWORK` flag and network test button from `GamesScreen.tsx`

### 6.6 Fix theme consistency

**Flagged by: Copilot**

Replace all hardcoded hex colors (`#f5f5f5`, `#666`, `#007AFF`, `#D32F2F`) with `themed()` / `useAppTheme()` across: `GamesScreen.tsx`, `GameDetailScreen`, `JoinGameModal`, `CreateGameModal`.

**Commits:** One per sub-phase (6.1 through 6.6).

---

## Phase 7: Testing Foundation

**Goal:** Build the test coverage that all 4 evaluators flagged as critically missing. Done after refactoring so tests target the final architecture.

**Risk: Low | Effort: 3-5 days**

### 7.1 Unit tests: Auth store

Test `signIn`, `signUp`, `signOut`, `refreshSession` with mocked Supabase client.
Verify error propagation, loading states, and session management.

### 7.2 Unit tests: Database modules

Test each module from Phase 6.1:
- `createGameHost` — code generation, collision retry
- `joinGameByCode` — invalid code, already member, game full
- `getUserGames` — empty state, populated state
- Error return handling from Phase 6.2

### 7.3 Unit tests: Domain validation

Test the validation layer from Phase 6.3:
- Status transition enforcement
- Join eligibility checks
- Input validation with Zod schemas

### 7.4 Component tests

- `CreateGameModal` — form validation, submission flow
- `JoinGameModal` — code input, error handling
- Auth-gated screen rendering

### 7.5 E2E: Maestro flows

Create at least:
- Login → view games → create game → verify in list
- Login → join game by code → verify in list
- Login → sign out → verify redirect

### 7.6 CI coverage enforcement

- Ensure `collectCoverageFrom` (from Phase 1) reports accurately
- Set minimum coverage thresholds in `jest.config.js`
- Include `test/` in TypeScript checking (use existing `test/test-tsconfig.json`)

**Commits:** One per test suite area.

---

## Phase 8: Documentation & Polish

**Goal:** Address documentation gaps and remaining cleanup.

**Risk: Low | Effort: 1-2 days**

### 8.1 Project CLAUDE.md

Create a project-level `CLAUDE.md` with:
- Build/run commands
- Architecture overview
- Key conventions
- Domain glossary

### 8.2 README rewrite

Replace Ignite boilerplate with CodewordApp-specific content:
- What the app is (Assassin-style game)
- How to set up and run locally
- Architecture overview
- Tech stack

### 8.3 Domain glossary

Add `specs/glossary.md` defining: host, member, assassin, target, codeword, round, assignment, elimination.

### 8.4 Post-upgrade cleanup

- Remove `react-native-url-polyfill` if no longer needed (check in Phase 4d)
- Remove `newArchEnabled` and `jsEngine` from `app.json` if now defaults in SDK 55
- Audit `plugins/withSplashScreen.ts` — remove if no longer needed
- Resolve `screens/` vs `app/` indirection pattern — document the convention or collapse

### 8.5 Full platform verification

- EAS build on both iOS and Android
- Run full Maestro E2E suite from Phase 7.5
- Manual regression test of all game flows

**Commit:** `Add project documentation and post-upgrade polish`

---

## Execution Summary

```
Phase 1: Pre-Flight & Dead Code Removal         [< 1 day]   Low risk
Phase 2: Critical Fixes (Security + UI)          [1-2 days]  Medium risk
Phase 3: Expo SDK 53 → 55                        [2-3 days]  High risk
Phase 4: Independent Library Upgrades            [2-3 days]  Mixed risk (parallelizable)
  ├── 4a: MMKV 3 → 4
  ├── 4b: FlashList 1 → 2
  ├── 4c: i18next 23 → 26
  └── 4d: url-polyfill 2 → 3 (or remove)
Phase 5: Toolchain Upgrades                      [2-3 days]  Mixed risk (parallelizable)
  ├── 5a: ESLint flat config
  ├── 5b: TypeScript 6 (conditional)
  └── 5c: Jest 30 (conditional)
Phase 6: Architecture Refactoring                [3-5 days]  Medium risk
Phase 7: Testing Foundation                      [3-5 days]  Low risk
Phase 8: Documentation & Polish                  [1-2 days]  Low risk
                                          Total: ~15-24 days
```

### Dependency Graph

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4a ──→ Phase 6 ──→ Phase 7 ──→ Phase 8
                                  ├─→ Phase 4b ──┘
                                  ├─→ Phase 4c ──┘
                                  ├─→ Phase 4d ──┘
                                  ├─→ Phase 5a ──┘
                                  ├─→ Phase 5b ──┘
                                  └─→ Phase 5c ──┘
```

Phases 4 and 5 are parallelizable. Phase 6 waits for all of them. Phase 7 waits for Phase 6 (tests target the refactored architecture). Phase 8 is the final sweep.

---

## Success Criteria

When this plan is complete, the codebase should:

- [ ] Have zero critical security vulnerabilities (MMKV key, RLS policies, email verification)
- [ ] Be on Expo SDK 55 with all dependencies at latest compatible versions
- [ ] Have no dead code or legacy artifacts from Better Auth migration
- [ ] Have `src/lib/database.ts` split into domain-specific modules
- [ ] Return typed errors instead of silent `null`/`[]` from all data operations
- [ ] Have meaningful test coverage for auth, game creation, game joining, and domain validation
- [ ] Have at least 3 Maestro E2E flows
- [ ] Have accurate coverage reporting with `collectCoverageFrom` configured
- [ ] Have all console logging gated behind `__DEV__`
- [ ] Have all UI colors using the theme system (dark mode ready)
- [ ] Have project-level documentation (CLAUDE.md, README, glossary)
- [ ] Pass `yarn compile && yarn lint:check && yarn test` with zero errors
- [ ] Build successfully on both iOS and Android via EAS
