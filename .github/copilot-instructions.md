# CodewordApp – GitHub Copilot Instructions

## Project Overview

CodewordApp is a mobile assassination/codeword party game. Players create or join games via invite codes, receive secret target assignments, and eliminate targets by getting them to say the codeword. Built with React Native (Expo) and Supabase.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.79 + Expo SDK 53 + Expo Router 5 |
| Language | TypeScript (strict mode) |
| State | Zustand 5 with MMKV persistence |
| Backend | Supabase (Auth, Postgres, RLS) |
| Schema | Drizzle ORM (definitions) + Zod 4 (runtime validation) |
| Testing | Jest + jest-expo + @testing-library/react-native |
| Styling | Inline styles + theme system (no CSS-in-JS library) |
| i18n | i18next + react-i18next |
| Networking | Apisauce (non-Supabase API calls) |
| Dev tools | Reactotron, ESLint, Prettier |

## Project Structure

```
src/
  app/              # Expo Router file-based routes
    (auth)/         # Login, signup (unauthenticated)
    (app)/          # Main tabs + game detail (authenticated)
      (tabs)/       # home, games, profile tabs
      game/         # Game detail routes
  components/       # Reusable UI: Button, Card, Text, Screen, etc.
  screens/          # Screen-level components rendered by routes
  stores/           # Zustand stores (authStore) + hooks
  lib/              # auth-client.ts, auth.ts, database.ts, network utils
  services/api/     # Apisauce API layer
  config/           # App configuration
  theme/            # Colors, spacing, typography
  i18n/             # Translation files
  utils/            # Date helpers, storage, general utilities
supabase/
  schema.ts         # Drizzle table definitions + Zod schemas + TypeScript types
  migrations/       # Numbered SQL migration files
  database.ts       # DB connection config
specs/              # Product specs: requirements.md, design.md
test/               # Jest setup, global mocks (setup.ts)
```

## Path Aliases

- `@/*` → `./src/*`
- `@assets/*` → `./assets/*`

Always use these aliases for imports within `src/`.

## Key Conventions

### Routing
- Two layout groups: `(auth)` (unauthenticated) and `(app)` (authenticated).
- Route guards live in `src/app/index.tsx` — redirects based on auth state.
- `AuthProvider` in `src/components/AuthProvider.tsx` subscribes to Supabase `onAuthStateChange`.

### State Management
- Auth state: `src/stores/authStore.ts` (Zustand + MMKV persistence).
- Store hooks: `src/stores/hooks.ts`.
- **No Redux.** Keep all state in Zustand or local component state.
- Persisted fields: `user`, `session`, `isAuthenticated` via `createJSONStorage(() => zustandStorage)`.

### Database Schema (Drizzle + Supabase)
Tables defined in `supabase/schema.ts`:
- `user_profiles` – extends Supabase auth.users
- `games` – game sessions; `status`: `lobby | active | ended`
- `user_games` – join table for players in games
- `game_words` – codewords that unlock over time (by `day_number`)
- `assignments` – assassin → target pairings
- `eliminations` – records of successful eliminations

All public tables have RLS policies. Keep RLS in sync with any schema changes. New migrations go in `supabase/migrations/` with sequential numbering.

### Auth
- `src/lib/auth-client.ts` wraps the Supabase JS client.
- `src/lib/auth.ts` contains helper functions (sign in, sign up, sign out, refresh).
- Never hardcode Supabase credentials. Use env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).

### Components
- Follow the Ignite component pattern: typed props interface + inline themed styles.
- Prefer existing components (`Text`, `Button`, `Card`, `Screen`, `ListView`, `TextField`, `Icon`, `Avatar`) before creating new ones.
- Reusable components → `src/components/`
- Screen-level components → `src/screens/`

### TypeScript
- Strict mode is enabled. Avoid `any`.
- Zod schemas for all runtime-validated data (API responses, form inputs).
- Drizzle `createInsertSchema` / `createSelectSchema` generate Zod schemas from table definitions.

### Styling
- Use the theme system: `src/theme/` (colors, spacing, typography).
- Inline styles with `StyleSheet.create` or direct style objects.
- No `styled-components` or `emotion`.

### i18n
- All user-facing strings go through `i18next` (`t("key")`).
- Translation files: `src/i18n/`.

## Commands

```bash
yarn start            # Start Expo dev server (requires dev client)
yarn ios              # Run on iOS simulator
yarn android          # Run on Android emulator
yarn compile          # TypeScript check (tsc --noEmit)
yarn lint             # ESLint with auto-fix
yarn lint:check       # ESLint without fix
yarn test             # Run Jest tests
yarn test:watch       # Jest in watch mode
```

## Testing

- Test files: colocated as `*.test.tsx` / `*.test.ts`, or in `test/`.
- Uses `jest-expo` preset; setup file at `test/setup.ts`.
- Mocks: react-native, i18next, expo-localization.
- Write unit tests for utilities, stores, and hooks.
- Write component tests with `@testing-library/react-native`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |

Injected via `app.config.ts` into `expo-constants` `extra`. See `.env.example`.  
**Never hardcode secrets in source files.**

## Rules & Guardrails

1. **TypeScript strict** – no `any`, no `@ts-ignore` without justification.
2. **RLS** – every new table must have Supabase RLS policies.
3. **Migrations** – sequential numbering in `supabase/migrations/`; never edit applied migrations.
4. **Components** – reuse before creating; follow Ignite patterns.
5. **Secrets** – env vars only; never commit credentials.
6. **State** – Zustand only; no Redux, no Context for global state.
7. **Routing** – use Expo Router file conventions; don't use `react-navigation` directly.
8. **Specs** – reference `specs/requirements.md` and `specs/design.md` for product decisions.
