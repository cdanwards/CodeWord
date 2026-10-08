# Codebase & Architecture Review: CodewordApp

**Date:** 2026-04-08
**Reviewer:** Claude Opus 4.6
**Branch:** Daniel-Edwards/test-setup
**Repo:** cdanwards/CodeWord

---

## Repository Scope & Sampling

This review covers the **entire repository** — all modules were examined.

| Area | Paths |
|------|-------|
| Root structure | `src/`, `supabase/`, `scripts/`, `specs/`, `llm-helpers/`, `test/`, `ignite/`, `plugins/`, `types/`, `.maestro/` |
| Database schema / migrations | `supabase/schema.ts`, `supabase/migrations/001-003*.sql`, `drizzle.config.ts` |
| Domain layer / core logic | `src/lib/database.ts`, `src/lib/auth.ts`, `src/lib/auth-client.ts` |
| Application / screens / routes | `src/app/`, `src/screens/`, `src/components/`, `src/stores/` |
| Event system / messaging | None present |
| Tests | `test/`, `src/components/Text.test.tsx`, `src/services/api/apiProblem.test.ts`, `src/utils/storage/storage.test.ts`, root `test-*.js` files |

---

## 1. High-Level Summary

| Attribute | Value |
|-----------|-------|
| Language(s) | TypeScript (strict), SQL |
| Database | PostgreSQL (Supabase-hosted), Drizzle ORM schema |
| Messaging/Events | None |
| Deployment | EAS Build (Expo Application Services) |
| Architecture | Layered monolith — Expo Router (file-based routing) + Zustand stores + Supabase BaaS |

**Main Strengths:**
- Well-structured Expo Router navigation with proper auth/app route groups and guards
- Comprehensive database schema with RLS policies providing row-level security from day one
- Solid foundation: TypeScript strict mode, i18n (7 languages), theming, MMKV-encrypted storage

**Main Concerns:**
- Extremely thin test coverage — only 4 real test files, and root-level `test-*.js` files are non-functional scripts (not Jest tests)
- Dual/redundant auth abstractions (`src/lib/auth.ts` and `src/lib/auth-client.ts`) create confusion about which to use
- Database helper (`src/lib/database.ts`) is a monolithic ~400-line file with no error typing, silent `null` fallbacks, and no domain modeling

**Top Risks:**
1. Silent data loss from `catch -> return null` pattern in database helpers
2. No automated test coverage for any game logic or database operations
3. Legacy Better Auth artifacts still present (`.env` secrets, `test-auth.js`, `seed-users.js`, `llm-helpers/better_auth.md`)
4. Network fallback system masks real errors rather than surfacing them
5. No input validation on user-facing forms beyond basic length checks

---

## 2. Detailed Findings by Category

### 2.1 Domain-Driven Design (DDD)

**Rating (0-10): 3**

**Short verdict:** The codebase has no explicit domain modeling. Business logic is split between raw Supabase queries in `src/lib/database.ts` and UI components in screens. There are no aggregates, entities, value objects, or domain services — just a flat data-access layer consumed directly by React components.

**Key strengths:**
- Database schema (`supabase/schema.ts`) captures the game domain reasonably well: games, assignments, eliminations, game words
- Zod schemas generated from Drizzle provide type-safe insert/select types
- Naming is generally clear and domain-aligned (e.g., `assassin_user_id`, `target_user_id`, `eliminated_at`)

**Key issues:**
- **[Major]** No domain layer exists between the database and the UI. `src/lib/database.ts` is a procedural bag of Supabase calls with no invariant enforcement. For example, `joinGameByCode` doesn't check game capacity, status, or whether the game has started.
- **[Major]** Game state transitions (pending -> active -> completed) have no validation — any status string can be written.
- **[Minor]** The `db` object in `src/lib/database.ts` mixes concerns: user profiles, games, assignments, eliminations, and game words are all in one flat namespace.
- **[Minor]** No ubiquitous language documented. Terms like "host", "member", "assassin", "target" are used in schema but not defined anywhere.

**Concrete recommendations:**
- Extract a `GameService` that enforces invariants: can't join a started game, can't eliminate a player not assigned to you, game code uniqueness, etc.
- Define game status as a TypeScript union type (`"pending" | "active" | "completed" | "cancelled"`) rather than a free string.
- Consider a `specs/glossary.md` defining domain terms (host, member, round, assignment, elimination, codeword).

---

### 2.2 Event-Driven Architecture (EDA)

**Rating (0-10): 1**

**Short verdict:** No event-driven architecture is present. The app uses direct synchronous Supabase queries. There is one database trigger (`on_auth_user_created` in migration 001) that auto-creates user profiles, but no application-level events.

**Key strengths:**
- The `on_auth_user_created` trigger is a good pattern for keeping profiles in sync with auth state.

**Key issues:**
- **[Minor]** No real-time subscriptions are used despite Supabase supporting them. The specs mention "real-time updates" as an open decision (`specs/design.md`).
- **[Nice-to-have]** No pub/sub or event bus for decoupling UI updates from data mutations.

**Concrete recommendations:**
- When implementing multiplayer features, use Supabase Realtime subscriptions for game state changes, player joins, and eliminations.
- Consider defining domain events (e.g., `PlayerJoined`, `PlayerEliminated`, `GameStarted`) even if initially handled in-process — this will make the transition to real-time easier.

---

### 2.3 Database & Data Modeling

**Rating (0-10): 6**

**Short verdict:** The schema is well-designed for the domain with proper foreign keys, RLS policies, and a reasonable normalization strategy. However, there are constraint gaps, the Drizzle schema and raw SQL migrations can drift, and some columns lack validation.

**Key strengths:**
- RLS policies on all tables from the start — proper security posture
- Sensible foreign key cascade strategy (CASCADE for user deletion, SET NULL for optional references)
- Unique constraint on game codes
- Composite unique on `(user_id, game_id)` in `user_games` prevents duplicate memberships
- Auto-profile creation trigger ensures data consistency

**Key issues:**
- **[Major]** `games.status` and `user_games.status` are free `text` columns with no CHECK constraint — any string can be inserted (`supabase/schema.ts:40`, `supabase/migrations/002_gameplay_extensions.sql:7`).
- **[Major]** `games.code` is generated in application code (`scripts/seed-game.js` and `src/lib/database.ts`) with a 6-char alphanumeric — no database-level format validation or generation function. Collision risk increases with scale.
- **[Minor]** `games.settings` is a free `jsonb` column with no schema validation — any JSON can be stored.
- **[Minor]** No index on `assignments.game_id` or `eliminations.game_id` for query performance on game-scoped lookups.
- **[Minor]** Drizzle schema (`supabase/schema.ts`) and SQL migrations are maintained separately — there's no mechanism to ensure they stay in sync.

**Concrete recommendations:**
- Add CHECK constraints for status columns: `CHECK (status IN ('pending', 'active', 'completed', 'cancelled'))`.
- Add indexes on `assignments(game_id)`, `eliminations(game_id)`, and `game_words(game_id)`.
- Consider a database function for game code generation to guarantee uniqueness atomically.
- Define a JSON schema or Zod validator for `games.settings`.

---

### 2.4 Code Cleanliness & Design Patterns

**Rating (0-10): 5**

**Short verdict:** The codebase is well-organized at the directory level with clear separation between routes, screens, components, stores, and utilities. However, it suffers from redundant abstractions, a monolithic database helper, and inconsistent patterns between similar modules.

**Key strengths:**
- Clean Expo Router file-based routing with logical `(auth)` / `(app)` groups
- Zustand store is well-structured with typed hooks (`useAuth()`, `useUser()`, `useIsAuthenticated()`)
- Theme system with `themed()` function is elegant and type-safe
- Component library (Button, Text, TextField, Card, etc.) follows consistent patterns with i18n support and preset systems
- MMKV storage with encryption for sensitive data

**Key issues:**
- **[Major]** Two competing auth abstractions: `src/lib/auth.ts` (returns `{success, error?, user?}` objects) and `src/lib/auth-client.ts` (thin Supabase wrapper). The auth store (`src/stores/authStore.ts`) uses `auth-client.ts` directly, making `auth.ts` effectively dead code.
- **[Major]** `src/lib/database.ts` is a ~400-line monolith with every database operation. No separation by domain area, no shared error handling pattern, inconsistent timeout values (8s vs 12s).
- **[Minor]** `JoinGameModal.tsx` contains debug styling (bright magenta/cyan colors) that appears to be leftover from development.
- **[Minor]** Root-level test scripts (`test-auth.js`, `test-db.js`, `test-profile.js`, `test-zustand.js`) are plain Node scripts that import React Native modules and will never execute correctly outside the RN runtime. They clutter the project root.
- **[Minor]** `scripts/seed-users.js` references the old Better Auth schema (dropped tables) — dead code.
- **[Nice-to-have]** `AuthProvider.tsx` component is in `components/` but is really an app-level provider, not a reusable component.

**Concrete recommendations:**
- Delete `src/lib/auth.ts` — all auth flows should go through the store which uses `auth-client.ts`.
- Split `src/lib/database.ts` into domain-specific modules: `lib/db/profiles.ts`, `lib/db/games.ts`, `lib/db/assignments.ts`.
- Remove root-level `test-*.js` files and `scripts/seed-users.js` (dead code).
- Remove debug styling from `JoinGameModal.tsx`.

---

### 2.5 Testability & Testing Approach

**Rating (0-10): 2**

**Short verdict:** Testing infrastructure exists (Jest, jest-expo, @testing-library/react-native, Maestro) but almost no tests have been written. The existing tests cover only boilerplate concerns (i18n key validation, API problem parsing, storage helpers, Text component rendering). No game logic, auth flows, or screen interactions are tested.

**Key strengths:**
- Jest configured with jest-expo preset and proper setup file
- Maestro E2E framework configured with a shared `_OnFlowStart.yaml`
- React Native Testing Library available as a dev dependency
- Test setup properly mocks native modules (Image, i18n, expo-localization)

**Key issues:**
- **[Critical]** Zero tests for any business logic: no tests for database helpers, auth store, game creation, game joining, or any screen behavior.
- **[Major]** The 4 root-level `test-*.js` files are not actual tests — they're Node scripts that `require()` React Native modules and would crash if run. They provide a false sense of coverage.
- **[Major]** No Maestro E2E test flows exist — only the shared setup YAML.
- **[Minor]** `test/i18n.test.ts` uses `execSync("grep")` to find translation keys — fragile and platform-dependent.

**Concrete recommendations:**
- Write unit tests for `src/stores/authStore.ts` — test signIn, signUp, signOut, refreshSession with mocked Supabase.
- Write unit tests for `src/lib/database.ts` — test createGameHost code generation, joinGameByCode error paths, etc.
- Create at least one Maestro E2E flow (e.g., login -> view games -> create game).
- Delete the root-level `test-*.js` scripts or convert them to proper Jest tests.

---

### 2.6 Bug Risks & Robustness

**Rating (0-10): 4**

**Short verdict:** The app has systematic error-swallowing throughout the database layer, no input validation on critical paths, and network fallback logic that can mask real failures. The auth flow is reasonable but game operations are fragile.

**Key strengths:**
- Network manager (`src/lib/network-utils.ts`) detects iOS Simulator and provides fallback mechanism
- Auth store handles loading states and error propagation
- Timeout wrappers prevent indefinite hangs on database calls
- RLS policies provide a security backstop even if app-level validation fails

**Key issues:**
- **[Critical]** Every function in `src/lib/database.ts` catches errors and returns `null` or `[]`. This means the UI silently shows empty state when the database is unreachable, a query fails, or data is malformed. Example: `getUserGames` returns `[]` on any error — the user sees "no games" instead of an error message.
- **[Major]** `createGameHost` generates a 6-character game code with no retry on collision. If the insert fails due to a unique constraint violation, it returns `null` with no feedback.
- **[Major]** No input sanitization on game names, descriptions, or user profile fields before sending to Supabase. Relies entirely on RLS and database constraints.
- **[Major]** `SignupScreen.tsx` validates password length (>=6 chars) but performs no other validation — no complexity requirements, no email format validation beyond basic `@` check.
- **[Minor]** `withTimeout` in database.ts rejects with a generic "Operation timed out" message — no indication of which operation timed out or what the user should do.
- **[Minor]** `GamesScreen.tsx` has a `DEV_TEST_NETWORK` flag and network test button that could leak into production.

**Concrete recommendations:**
- Replace `catch -> return null` with typed error returns: `{ data: T | null, error: string | null }`. This lets the UI distinguish "no data" from "failed to load."
- Add retry logic (with jitter) to `createGameHost` for code collision.
- Add Zod validation on all user inputs before database writes — the schemas already exist in `supabase/schema.ts`.
- Strip `DEV_TEST_NETWORK` code from GamesScreen or gate it properly behind `__DEV__`.

---

### 2.7 Documentation & Discoverability

**Rating (0-10): 6**

**Short verdict:** The project has above-average documentation for an early-stage app. Specs, migration guides, network issue notes, and LLM helper docs exist. However, there's no CLAUDE.md for the project, the README is mostly Ignite boilerplate, and the documentation is fragmented across `specs/`, `llm-helpers/`, and root-level markdown files.

**Key strengths:**
- `specs/` directory has requirements, design, tasks, and network resolution plan — good for onboarding
- `SUPABASE_AUTH_MIGRATION.md` is thorough and actionable
- `NOTES_NETWORK_ISSUES.md` captures debugging context that would otherwise be lost
- `llm-helpers/` provides comprehensive context for AI-assisted development
- Inline code comments are minimal but the code is generally self-documenting

**Key issues:**
- **[Major]** No project-level `CLAUDE.md` — the global one references project documentation but none exists for this repo.
- **[Minor]** README is 80% Ignite boilerplate with a small CodewordApp section appended. A new developer would struggle to understand the game domain.
- **[Minor]** `llm-helpers/better_auth.md` (631KB) is a massive file for a system that's been migrated away from — dead documentation.
- **[Minor]** No architecture diagram or data flow visualization.
- **[Nice-to-have]** No API documentation for the `db` helper functions.

**Concrete recommendations:**
- Create a project-level `CLAUDE.md` with build commands, architecture overview, and conventions.
- Rewrite the README to lead with CodewordApp (what it is, how to run it, architecture overview) and move Ignite references to a footnote.
- Delete `llm-helpers/better_auth.md` — it documents a removed system.
- Add a domain glossary defining game terms.

---

## 3. Prioritized Recommendations

| # | Title | Explanation | Impact | Effort |
|---|-------|-------------|--------|--------|
| 1 | **Replace silent null returns with typed error handling** | Every `db.*` function swallows errors and returns `null`/`[]`. This makes debugging impossible and shows users empty state instead of error messages. Introduce a `Result<T>` type pattern and propagate errors to the UI. | High | Medium |
| 2 | **Write core test suite** | Zero business logic tests exist. Start with: auth store (sign in/up/out flow), `createGameHost` (code generation, collision), `joinGameByCode` (invalid code, already member, game full). This alone would catch the most common regressions. | High | Medium |
| 3 | **Consolidate auth abstractions and remove legacy artifacts** | Delete `src/lib/auth.ts` (redundant), `scripts/seed-users.js` (dead), `test-auth.js` through `test-zustand.js` (non-functional), and `llm-helpers/better_auth.md` (631KB of dead docs). Reduces confusion and project size. | Medium | Low |
| 4 | **Add domain validation layer** | Game status transitions, join eligibility, and assignment rules have no enforcement. Add a thin service layer (or at minimum Zod validation) between the UI and `db.*` calls to enforce invariants before writes. | High | Medium |
| 5 | **Add database constraints for status columns** | `games.status` and `user_games.status` accept any string. Add CHECK constraints in a new migration and corresponding TypeScript union types. | Medium | Low |

---

## 4. Summary Table

| Category | Rating (0-10) | One-line comment |
|---|---|---|
| Domain-Driven Design (DDD) | 3 | No domain layer; business logic is raw Supabase queries consumed by UI |
| Event-Driven Architecture | 1 | Not applicable yet; one DB trigger exists |
| Database & Data Modeling | 6 | Good schema with RLS, but missing constraints and indexes |
| Code Cleanliness & Patterns | 5 | Clean structure, but redundant abstractions and a monolithic DB helper |
| Testability & Testing | 2 | Infrastructure exists, but almost zero actual tests |
| Bug Risks & Robustness | 4 | Systematic error swallowing and no input validation |
| Documentation & Discoverability | 6 | Good specs and migration docs, but fragmented and partially stale |

---

## 5. Final Overall Rating

### 3.9 / 10

This is an early-stage React Native app with a **solid technical foundation** (TypeScript strict, Expo Router, Supabase RLS, Zustand, i18n, theming) but **significant gaps in the areas that determine production readiness**: testing, error handling, domain validation, and code hygiene. The project is clearly in active development — the architecture choices are sound and the schema design is thoughtful, but the application layer between the database and the UI is too thin and too error-prone. Addressing the silent error swallowing and adding a basic test suite would move this score to the 5-6 range quickly. Adding a domain validation layer and cleaning up legacy artifacts would push it to 7+.
