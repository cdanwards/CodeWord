# CodewordApp - Claude Instructions

## Project Overview

CodewordApp is a mobile assassination/codeword party game built with React Native (Expo SDK 53) and Supabase. Players create or join games via invite codes, receive secret word assignments, and eliminate targets by getting them to say the codeword. The app is scaffolded from Ignite (Infinite Red boilerplate).

## Tech Stack

- **Framework:** React Native 0.79 + Expo SDK 53 + Expo Router 5 (file-based routing)
- **Language:** TypeScript (strict mode)
- **State:** Zustand 5 with MMKV persistence
- **Backend:** Supabase (Auth, Postgres, RLS policies)
- **Schema/Validation:** Drizzle ORM for schema definitions, Zod 4 for runtime validation
- **Testing:** Jest + jest-expo + @testing-library/react-native
- **Styling:** Inline styles / theme system (no CSS-in-JS library)
- **i18n:** i18next + react-i18next
- **Networking:** Apisauce (for non-Supabase API calls)
- **Dev tools:** Reactotron, ESLint, Prettier

## Project Structure

```
src/
  app/              # Expo Router file-based routes
    (auth)/         # Login, signup screens (unauthenticated)
    (app)/          # Main app tabs + game detail (authenticated)
      (tabs)/       # home, games, profile tabs
      game/         # Game detail routes
  components/       # Reusable UI components (Button, Card, Text, etc.)
  screens/          # Screen-level components rendered by routes
  stores/           # Zustand stores (authStore) + hooks
  lib/              # Core utilities: auth client, database helpers, network
  services/api/     # Apisauce API layer
  config/           # App configuration
  theme/            # Colors, spacing, typography
  i18n/             # Translations
  utils/            # General utilities (dates, storage, etc.)
supabase/
  schema.ts         # Drizzle table definitions + Zod schemas + types
  migrations/       # SQL migration files
  database.ts       # DB connection config
specs/              # Product specs (requirements.md, design.md)
test/               # Jest setup, mocks, test config
ClaudePlans/        # Implementation plans (preferred location for plans)
```

## Key Conventions

### Path Aliases
- `@/*` maps to `./src/*`
- `@assets/*` maps to `./assets/*`

### Routing
- Expo Router file-based routing with two groups: `(auth)` and `(app)`
- Route guards in `src/app/index.tsx` redirect based on auth state
- `AuthProvider` wraps the app and manages Supabase `onAuthStateChange`

### State Management
- Auth state lives in `src/stores/authStore.ts` (Zustand + MMKV)
- Store hooks in `src/stores/hooks.ts`
- No Redux; keep all state in Zustand or local component state

### Database
- All table schemas defined in `supabase/schema.ts` using Drizzle ORM
- Type-safe CRUD helpers in `src/lib/database.ts` using Supabase client directly
- Tables: `user_profiles`, `games`, `user_games`, `game_words`, `assignments`, `eliminations`
- RLS policies enforced on all public tables
- Migrations in `supabase/migrations/` (numbered SQL files)

### Auth
- `src/lib/auth-client.ts` wraps the Supabase client
- `src/lib/auth.ts` contains auth helper functions
- Session persisted via MMKV through Zustand

### Components
- Follow existing Ignite component patterns (props interfaces, themed styling)
- Reusable components in `src/components/`
- Screen components in `src/screens/`
- Use the existing `Text`, `Button`, `Card`, `Screen` components before creating new ones

## Commands

```bash
yarn start            # Start Expo dev server (requires dev client)
yarn ios              # Run on iOS
yarn android          # Run on Android
yarn compile          # TypeScript check (tsc --noEmit)
yarn lint             # ESLint with auto-fix
yarn lint:check       # ESLint without fix
yarn test             # Run Jest tests
yarn test:watch       # Jest in watch mode
```

## Testing

- Test files: colocated as `*.test.tsx` / `*.test.ts` next to source, or in `test/`
- Jest config: `jest.config.js` uses `jest-expo` preset
- Setup file: `test/setup.ts` (mocks for react-native, i18next, expo-localization)
- Run `yarn test` to execute; `yarn compile` for type checking

## Environment

- Supabase URL and anon key come from environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- Injected via `app.config.ts` into `expo-constants` `extra`
- Never hardcode secrets in source files
- See `.env.example` for required variables

## Rules

- Follow TypeScript strict mode; avoid `any` types
- Keep Supabase RLS policies in sync with any schema changes
- New migrations go in `supabase/migrations/` with sequential numbering
- Use existing component library before creating new components
- Plans should be saved to `ClaudePlans/` at the project root
- Reference `specs/requirements.md` and `specs/design.md` for product context
