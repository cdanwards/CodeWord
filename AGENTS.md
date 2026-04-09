# CodewordApp Agent Guide

This file is the repo-specific operating guide for coding agents working in this project. Use it as the first stop before making changes. If another agent instruction file exists, keep it in sync with this one rather than inventing a competing source of truth.

## Project Summary

CodewordApp is a React Native mobile app for an assassins-style codeword game. Players authenticate with Supabase, create or join games via invite codes, and can view game details including members and seeded words.

The app started from the Ignite boilerplate, but this repo now has project-specific auth, game, and Supabase database logic layered on top.

## Tech Stack

- React Native `0.79.5`
- Expo SDK `53`
- Expo Router `5` with file-based routing
- TypeScript in strict mode
- Zustand `5` for auth state
- MMKV-backed persisted storage through the Zustand storage adapter
- Supabase for auth and Postgres access
- Drizzle ORM + `drizzle-zod` for schema/types
- Jest + `jest-expo` for tests
- i18next for localization
- Ignite component/theme patterns

## Current Product State

Current implementation is beyond pure scaffolding:

- Auth route groups exist for unauthenticated and authenticated flows.
- Supabase email/password sign-in and sign-up are wired through the auth store.
- App bootstrap wraps the tree with theme, auth, bottom sheet, keyboard, and safe-area providers.
- Game flows exist for:
  - listing the current user's games
  - creating a game as host
  - joining a game by code
  - viewing a game detail screen
- Supabase schema and migrations exist for:
  - `user_profiles`
  - `games`
  - `user_games`
  - `game_words`
  - `assignments`
  - `eliminations`

There is still cleanup and polish needed:

- Some docs are stale or boilerplate-derived.
- There are Supabase debug logs and migration leftovers in the codebase.
- `.env` currently appears out of sync with the active Supabase client setup.

## Repo Layout

Primary directories:

- `src/app/`: Expo Router routes
- `src/screens/`: screen components used by routes
- `src/components/`: reusable UI components and bottom-sheet modals
- `src/stores/`: Zustand store and hooks
- `src/lib/`: auth client, database helpers, network helpers
- `src/theme/`: theme context, spacing, colors, typography
- `src/i18n/`: localization setup
- `supabase/`: client config, Drizzle schema, SQL migrations
- `scripts/`: Node scripts for Supabase testing and seeding
- `test/`: Jest setup and support files
- `specs/`: product/design requirements
- `ClaudePlans/`, `MainPlans/`, `VerifiedSpecs/`, `Evaluations/`: planning and review artifacts

## Key Files To Read First

Read these before making non-trivial changes:

- `src/app/_layout.tsx`: app bootstrap and provider composition
- `src/app/index.tsx`: initial auth-based redirect
- `src/app/(auth)/_layout.tsx`: auth route guard
- `src/app/(app)/_layout.tsx`: app route guard
- `src/stores/authStore.ts`: auth state and Supabase auth actions
- `src/components/AuthProvider.tsx`: auth subscription and profile bootstrapping
- `src/lib/auth-client.ts`: thin wrapper around Supabase auth APIs
- `src/lib/database.ts`: main game/profile CRUD helpers
- `supabase/schema.ts`: database schema and exported types
- `supabase/migrations/*.sql`: database/RLS source of truth
- `specs/requirements.md`: current milestone and acceptance criteria

## Routing Model

Expo Router uses route groups:

- `src/app/(auth)/`: unauthenticated routes
  - `login.tsx`
  - `signup.tsx`
- `src/app/(app)/`: authenticated routes
  - `(tabs)/home.tsx`
  - `(tabs)/games.tsx`
  - `(tabs)/profile.tsx`
  - `game/[id].tsx`

Auth flow expectations:

- `src/app/index.tsx` redirects to `/(auth)/login` or `/(app)/(tabs)/home`
- `src/app/(auth)/_layout.tsx` redirects authenticated users into the app
- `src/app/(app)/_layout.tsx` redirects unauthenticated users back to login

When changing auth or routing behavior, keep all three aligned.

## State And Data Flow

Auth:

- `useAuthStore` in `src/stores/authStore.ts` is the canonical client auth state.
- `AuthProvider` calls `checkAuth()` on mount and listens to `onAuthStateChange`.
- On sign-in, the provider also ensures a `user_profiles` row exists via `db.ensureUserProfile(...)`.

Database:

- `src/lib/database.ts` is the main client-facing database abstraction.
- Prefer adding or adjusting helpers there instead of scattering direct Supabase calls across screens.
- `supabase/schema.ts` defines the TS/Drizzle model for public tables.

Game UI:

- `src/screens/GamesScreen.tsx` lists memberships and opens create/join modals.
- `src/components/CreateGameModal.tsx` creates a host-owned game with a generated code.
- `src/components/JoinGameModal.tsx` validates a code and inserts a `user_games` row.
- `src/app/(app)/game/[id].tsx` loads a game, members, and words for the detail screen.

## Environment

Active app env usage is Supabase-based:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- optional: `NETWORK_CHECKS_ENABLED=1`

These are injected through `app.config.ts` into `expo-constants` `extra`, with a fallback to `process.env`.

Important notes:

- `supabase/database.ts` throws at startup if `SUPABASE_URL` or `SUPABASE_ANON_KEY` are missing.
- The checked-in `.env` is not a reliable source of truth right now; it currently contains Better Auth-era values and does not match the active client config.
- Docs mention `.env.example`, but none exists at repo root as of this file's creation.
- Never commit real secrets or hardcode credentials into source.

## Commands

Core dev commands:

```bash
yarn start
yarn ios
yarn android
yarn web
yarn compile
yarn lint
yarn lint:check
yarn test
yarn test:watch
```

Project-specific commands:

```bash
yarn test:maestro
yarn test:supabase
```

Build commands:

```bash
yarn build:ios:sim
yarn build:ios:dev
yarn build:ios:preview
yarn build:ios:prod
yarn build:android:sim
yarn build:android:dev
yarn build:android:preview
yarn build:android:prod
```

Supabase workflow:

```bash
supabase start
supabase db reset --local
supabase db push --linked
node scripts/seed-game.js
node scripts/seed-users.js
```

## Coding Conventions

- Prefer existing Ignite-style components such as `Screen`, `Text`, `Button`, `TextField`, `Spacer`, `Avatar`.
- Prefer `@/` and `@assets/` path aliases over long relative imports inside `src/`.
- Keep TypeScript strict; avoid introducing new `any` usage.
- Reuse `src/lib/database.ts` and `src/lib/auth-client.ts` instead of duplicating Supabase access patterns.
- Keep route guards, auth state, and redirect logic consistent when touching auth flows.
- When schema changes are needed, update both:
  - `supabase/schema.ts`
  - `supabase/migrations/` with a new sequential SQL migration
- Keep RLS expectations in mind when modifying database behavior.

## Testing Expectations

For app logic changes, prefer to run the smallest useful checks:

- `yarn compile` for TypeScript correctness
- `yarn lint:check` for lint validation
- `yarn test` for Jest coverage

Test setup details:

- Jest preset is `jest-expo`
- `test/setup.ts` mocks `react-native`, localization, and i18n helpers
- Existing tests are light; add focused tests around new logic where practical

## Docs And Source-Of-Truth Guidance

Use these as the most trustworthy docs:

- `specs/requirements.md`: current milestone scope
- `supabase/schema.ts` and `supabase/migrations/`: actual DB model
- `package.json`: authoritative command list
- the current source files under `src/`

Treat these with caution:

- `README.md`: top half is mostly Ignite boilerplate; the project-specific Supabase notes near the bottom are more relevant
- `llm-helpers/project.md`: partially outdated and still references Better Auth
- `llm-helpers/implementation-roadmap.md`: useful for future ideas, not current implementation truth
- `NOTES_NETWORK_ISSUES.md`: historical context only; some described workarounds are no longer reflected in source
- `SUPABASE_AUTH_MIGRATION.md`: useful migration history, but not the current day-to-day operating guide

## Known Pitfalls

- `JoinGameModal.tsx` currently includes obvious debug styling colors; preserve or remove intentionally, not accidentally.
- There is substantial debug logging in auth, routing, and Supabase-related files.
- Better Auth remnants still exist in docs and env-related artifacts even though the active app auth path is Supabase.
- `src/lib/auth.ts` overlaps with `src/lib/auth-client.ts`; prefer the latter plus the auth store/provider flow unless intentionally consolidating them.
- Some planning directories contain proposals that are not fully implemented; verify against source before acting on them.

## Agent Workflow

Before large changes:

1. Read the relevant route, screen, store, and database helper files.
2. Verify whether the requested behavior is already implemented in another part of the repo.
3. Check `specs/requirements.md` before changing product behavior.
4. If database behavior changes, inspect the existing migrations and RLS assumptions first.

When making changes:

- Preserve the current Expo Router grouping and auth redirects unless the task is specifically about changing them.
- Keep edits localized and consistent with existing patterns.
- Do not reintroduce Better Auth concepts unless the user explicitly asks for that migration path.
- Prefer updating docs when you materially change architecture, commands, or workflow.

After changes:

- Run the narrowest relevant validation commands you can.
- Mention clearly if validation could not be run because env, simulator, or Supabase setup was unavailable.

