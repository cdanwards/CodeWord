# CodewordApp - Claude Instructions

## Start here

- **`docs/README.md` is the canonical documentation** (architecture, database and RLS, local setup, testing, design system, decisions). Read the relevant doc before changing that area, and update it in the same change (see `docs/governance/ownership-and-decision-records.md`).
- Product intent: `specs/requirements.md`, `specs/design.md`, and vocabulary in `specs/glossary.md`.
- `MainPlans/`, `VerifiedSpecs/`, `ClaudePlans/`, `Evaluations/` and `llm-helpers/` are plans, reviews and old notes. They are **not authoritative**: several describe code that has since changed. Check the code and `docs/` first.

## Project Overview

CodewordApp is a mobile Word Assassins companion built with React Native (Expo SDK 53) and Supabase. Players join an operation with a six-character code, get a secret target and a growing set of codewords (one new word per day), and eliminate their target by getting them to say any of their words; the target confirms, and the killer inherits the victim's target and words. The app is scaffolded from Ignite (Infinite Red boilerplate).

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
    (app)/          # Authenticated: tabs, case files list, game screen
      (tabs)/       # home (HQ), profile (Agent)
      game/[id].tsx # Polls the engine and renders one view from components/game
  components/       # Shared components (Button, Text, TextField, Screen, sheets)
    ui/             # Dossier primitives (Stamp, Folder, Sheet, TopBar, Chip, CodeBoxes, ...)
    game/           # Game-state views: Lobby, Mission + ReportSheet, IncomingReport, Eliminated, Debrief
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
docs/               # Canonical documentation (start at docs/README.md)
specs/              # Product specs (requirements.md, design.md, glossary.md)
scripts/            # simulate-game.mjs (engine checks), agent.mjs (play as test agents)
plugins/            # Expo config plugins (incl. the Xcode 26 fmt fix)
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
- Tables: `user_profiles`, `games`, `user_games`, `assignments`, `eliminations`, `elimination_confirmations`, `game_results`, `word_bank`, `agent_words`
- RLS policies enforced on all public tables
- Migrations in `supabase/migrations/` (numbered SQL files)

- **Case boundary:** Postgres columns are snake_case; app types are camelCase. In `src/lib/database.ts`, wrap every row returned with `fromRow(...)` and every camelCase insert/update payload with `toRow(...)`. Never read `row.user_id` in UI code or send `{ gameId }` to Supabase. The client is untyped, so TypeScript will not catch a miss.
- Queries that embed a relation (`select("*, games (*)")`) return the `*With*` types from `supabase/schema.ts` (e.g. `UserGameWithGame`).
- Local dev runs against `supabase start` (Docker); see README "Running locally". Inspect the DB with `docker exec supabase_db_CodeWord psql -U postgres`.

### Auth
- `src/lib/auth-client.ts` wraps the Supabase client (sole auth module)
- Session persisted via MMKV through Zustand
- Never `await` a Supabase call inside an `onAuthStateChange` callback. Supabase holds its auth lock while the callback runs, so the call deadlocks every later `getSession`. Defer it with `setTimeout(..., 0)` (see `AuthProvider`).

### Game engine
- Rules and SQL live in `supabase/migrations/005_game_engine.sql` (word bank seed: `006_word_bank.sql`). Agents hold several codewords: one new word per day (hard → medium → easy), plus every word inherited from agents they eliminate. Targets confirm or dispute reports. The host plays.
- All game actions go through SECURITY DEFINER functions: `start_game`, `my_mission`, `game_board`, `report_elimination`, `respond_to_elimination`, `end_game`. Client wrappers: `db.getMission`, `db.getBoard`, `db.startGame`, `db.endGame`, `db.reportElimination`, `db.respondToElimination` (actions return `ActionResult`). Never write `assignments`, `eliminations` or `agent_words` from the client.
- Daily words and the time limit are applied lazily whenever `my_mission` / `game_board` / `report_elimination` runs; there is no cron.
- The kill feed hides the word from everyone except the killer and the victim.
- After changing the engine, run `node scripts/simulate-game.mjs` (plays full games against local Supabase and checks rules and permissions). `node scripts/agent.mjs <alice|bob|priya|dev> <command> <CODE>` plays as a test agent from the terminal.
- UI: `src/app/(app)/game/[id].tsx` polls and picks one view from `src/components/game/` (Lobby, Mission + ReportSheet, IncomingReport, Eliminated, Debrief).

### Design system
- "Spy dossier" design; source of truth is the Claude Design project described in `ClaudePlans/dossier-redesign.md`, which also maps every design class to a component. Light-only: paper/manila surfaces; the sign-in cover and the active mission opt into `colors.night*`.
- Text presets: `display`, `heading`, `title`, `subheading` (condensed uppercase), `copy`, `label`, `meta`, `mono`. Buttons: `filled`, `primary` (red), `default` (outline), `danger`, `paper`, `ghostNight`.
- Dossier primitives are in `src/components/ui/` (Stamp, Folder, Sheet, Rule, Redaction, AgentPhoto, TopBar, Chip, Segmented, CodeBoxes, SheetTextInput). Inside a gorhom bottom sheet pass `InputComponent={SheetTextInput}` to TextField / CodeBoxes so the sheet tracks the keyboard.

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
supabase start                    # Local backend (Docker)
supabase migration up --local     # Apply new migrations, keep data
node scripts/simulate-game.mjs    # Engine rules + RLS checks against the local backend
node scripts/agent.mjs <agent> <command> <CODE>   # Act as a test agent
```

## Testing

- Test files: colocated as `*.test.tsx` / `*.test.ts` next to source, or in `test/`
- Jest config: `jest.config.js` uses `jest-expo` preset
- Setup file: `test/setup.ts` (mocks for react-native, i18next, expo-localization)
- Run `yarn test` to execute; `yarn compile` for type checking
- Any database or engine change: `supabase db reset --local && node scripts/simulate-game.mjs`, and add a check for new rules or permissions
- UI changes: verify on the iOS simulator (see `docs/development/testing-matrix.md`)

## Environment

- Supabase URL and anon key come from environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- Injected via `app.config.ts` into `expo-constants` `extra`
- Never hardcode secrets in source files
- Use `app.config.ts` as the source of truth for required environment variables, and keep these names in sync with it

## Out-of-Scope TODOs

Before starting work, check `OUT-OF-SCOPE-TODOS/` for open issues surfaced by prior reviews. If any can be naturally resolved as part of your current task, include the fix and mark the TODO as done. Do not go out of your way to fix unrelated items.

## Rules

- Follow TypeScript strict mode; avoid `any` types
- Keep Supabase RLS policies in sync with any schema changes; game state is engine-only (never add client write access to `assignments`, `eliminations`, `agent_words`, or `games.status`)
- Architectural or game-rule decisions get an ADR in `docs/adr/`
- New migrations go in `supabase/migrations/` with sequential numbering
- Use existing component library before creating new components
- Plans should be saved to `ClaudePlans/` at the project root
- Reference `specs/requirements.md` and `specs/design.md` for product context
