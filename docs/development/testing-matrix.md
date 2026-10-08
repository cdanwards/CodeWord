# Testing matrix

| Check | Command | Covers | Needs | Run when |
|---|---|---|---|---|
| Types | `yarn compile` | TypeScript strict across the app | nothing | Every change |
| Lint | `yarn lint:check` (`yarn lint` fixes) | ESLint + Prettier, import order, no inline styles, no raw `Text`/`TextInput` | nothing | Every change |
| Unit tests | `yarn test` | Jest: Text component, storage, API problem mapping, i18n | nothing | Every change |
| Game engine | `node scripts/simulate-game.mjs` | Plays full operations with real signed-in agents: start rules, target chain, word issuing by day, report / dispute / confirm, inheritance, win and time-up, and the RLS boundaries | `supabase start` | Any migration or engine change; before merging backend work |
| Manual multiplayer | `node scripts/agent.mjs …` + the simulator | The real UI against other agents' moves | `supabase start`, dev client, Metro | UI changes to game screens |
| Supabase reachability | `yarn test:supabase` | The app's configured URL answers | backend running | Debugging connection problems |
| E2E | `yarn test:maestro` | Maestro flows in `.maestro/flows` (still the Ignite samples) | Maestro, a build | Not maintained yet (spec 22) |

## Gaps

- No tests for `src/lib/database.ts` or the auth store yet (specs 19, 20).
- No component tests for the dossier primitives or game views (spec 21).
- No CI: run the checks locally (spec 30).
- The engine simulation fast-forwards game clocks with the local service-role key; it never runs against a hosted project.

## Before you call something done

1. `yarn compile && yarn lint:check && yarn test`
2. If the database changed: `supabase db reset --local && node scripts/simulate-game.mjs`
3. If a screen changed: look at it on the simulator, including the empty, loading and error states.
