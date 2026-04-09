# Spec 23: Project Documentation

**Phase:** 8.1 - 8.3 (Documentation & Polish)
**Priority:** Medium
**Effort:** 2-3 hours
**Dependencies:** All previous phases (documents the final state)
**Blocked by:** Phase 7 completion

---

## Objective

Create project-level documentation that was flagged as missing by the evaluations:
1. Project `CLAUDE.md` for AI-assisted development
2. Rewritten README (replace Ignite boilerplate)
3. Domain glossary

---

## Deliverable 1: Project CLAUDE.md

**File:** `CLAUDE.md` (project root)

Should contain:

### Build & Run Commands
```
yarn install          # Install dependencies
yarn start            # Start Expo dev server
yarn ios              # Run on iOS Simulator
yarn android          # Run on Android Emulator
yarn compile          # TypeScript type check
yarn lint:check       # ESLint check
yarn test             # Run Jest tests
yarn test:coverage    # Run tests with coverage
```

### Architecture Overview
- Expo Router file-based routing (`src/app/`)
- Zustand stores with MMKV persistence (`src/stores/`)
- Supabase BaaS: Auth, PostgreSQL with RLS, Secure Store for sessions
- Drizzle ORM schema-as-code (`supabase/schema.ts`)
- Split database modules (`src/lib/db/`)
- Domain validation layer (`src/lib/validation/`)
- Theme system with `themed()` function (`src/theme/`)
- i18n with i18next (7 languages, `src/i18n/`)

### Key Conventions
- All database functions return `Result<T>` type (never silent nulls)
- Use granular Zustand hooks (`useUser()`, `useIsAuthenticated()`) not `useAuth()`
- All colors from theme system — no hardcoded hex values
- Console logging gated behind `__DEV__`
- Game status transitions enforced by validation layer
- Migrations in `supabase/migrations/` — numbered sequentially

### Directory Structure
```
src/
  app/           # Expo Router routes
  components/    # Reusable UI components
  i18n/          # Translations
  lib/           # Business logic
    db/          # Database modules (split by domain)
    validation/  # Input validation + game rules
  screens/       # Screen implementations
  stores/        # Zustand state management
  theme/         # Theme system
  utils/         # Utilities
supabase/
  schema.ts      # Drizzle schema (source of truth for types)
  database.ts    # Supabase client initialization
  migrations/    # SQL migrations (numbered)
```

---

## Deliverable 2: README Rewrite

**File:** `README.md` (project root)

Replace Ignite boilerplate with CodewordApp-specific content:

### Sections:
1. **What is CodewordApp?** — Brief description of the Assassin-style mobile game
2. **Tech Stack** — Expo, React Native, TypeScript, Supabase, Drizzle, Zustand
3. **Getting Started**
   - Prerequisites (Node, Yarn, Expo CLI, Supabase CLI)
   - Clone and install
   - Set up `.env` with Supabase credentials
   - Run locally
4. **Project Structure** — Key directories and their purpose
5. **Database** — How to run migrations, seed data
6. **Testing** — How to run unit tests, coverage, E2E
7. **Development** — Hot reload, debugging, Reactotron

---

## Deliverable 3: Domain Glossary

**File:** `specs/glossary.md`

Define game domain terms used throughout the codebase:

| Term | Definition |
|------|-----------|
| **Host** | The player who created the game. Has admin privileges (start game, manage settings). |
| **Member/Player** | Any player who has joined a game (including the host). |
| **Assassin** | A player's role in an active game — each assassin is assigned a target. |
| **Target** | The player assigned to an assassin for elimination. |
| **Codeword** | A secret word assigned to each target. The assassin must get the target to say this word to eliminate them. |
| **Elimination** | The act of getting your target to say their codeword. |
| **Assignment** | The mapping of assassin -> target -> codeword for a given round. |
| **Round** | A cycle of assignments. When a target is eliminated, the assassin inherits their target. |
| **Game Code** | A 6-character alphanumeric code used to invite players to join a game. |
| **Lobby** | The initial game state where players can join before the game starts. |

### Status Definitions

**Game Status:**
- `lobby` — Game created, accepting players
- `pending` — Game about to start, assignments being generated
- `active` — Game in progress, eliminations happening
- `completed` — Game finished, winner determined
- `cancelled` — Game cancelled by host

**User Game Status:**
- `active` — Player is alive and participating
- `eliminated` — Player was eliminated
- `left` — Player left the game voluntarily
- `won` — Player is the last one standing

**Assignment Status:**
- `pending` — Assignment created but not yet active
- `active` — Assignment is live, assassin is hunting target
- `completed` — Target was successfully eliminated
- `failed` — Assignment failed (e.g., time expired)

---

## Files Changed

| File | Change |
|------|--------|
| `CLAUDE.md` | **New** — project-level AI development context |
| `README.md` | **Rewritten** — CodewordApp-specific content |
| `specs/glossary.md` | **New** — domain term definitions |

---

## Acceptance Criteria

- [ ] `CLAUDE.md` exists at project root with build commands, architecture, and conventions
- [ ] `README.md` leads with CodewordApp (not Ignite boilerplate)
- [ ] `README.md` includes setup instructions that a new developer can follow
- [ ] `specs/glossary.md` defines all domain terms used in the schema
- [ ] All status values in the glossary match the CHECK constraints from Spec 07

---

## Risks

- **Staleness:** Documentation decays. Keep it high-level enough that it doesn't need updating with every code change. Point to code for specifics.
