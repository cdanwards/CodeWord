# Testing matrix

| Check | Command | Covers | Needs | Run when |
|---|---|---|---|---|
| Types | `yarn compile` | TypeScript strict across the app | nothing | Every change |
| Lint | `yarn lint:check` (`yarn lint` fixes) | ESLint + Prettier, import order, no inline styles, no raw `Text`/`TextInput` | nothing | Every change |
| Unit tests | `yarn test` | Jest: Text component, storage, API problem mapping, i18n, push ticket handling | nothing | Every change |
| Game engine | `node scripts/simulate-game.mjs` | Plays full operations with real signed-in agents: start rules, target chain, word issuing by day, report / dispute / confirm, inheritance, win and time-up, the RLS boundaries, and which agents each event notifies | `supabase start` | Any migration or engine change; before merging backend work |
| Push delivery | `node scripts/push-check.mjs` | Outbox to `send-push` to a local Expo stand-in: delivery per device, rows marked sent, dead tokens dropped, the function's auth | `supabase start` with `supabase/functions/.env` from the example | Changes to migration 009's delivery path or `send-push` |
| Push on the simulator | `xcrun simctl push` with a payload ([example](../architecture/push-notifications.md#local-development)) | Banner, tap to open the game, refresh of an open game | dev client, Metro | Changes to `src/lib/notifications.ts` |
| Manual multiplayer | `node scripts/agent.mjs …` + the simulator | The real UI against other agents' moves | `supabase start`, dev client, Metro | UI changes to game screens |
| Supabase reachability | `yarn test:supabase` | The app's configured URL answers | backend running | Debugging connection problems |
| E2E | `yarn test:maestro` | Maestro flows in `.maestro/flows` (still the Ignite samples) | Maestro, a build | Not maintained yet (spec 22) |

## Gaps

- No tests for `src/lib/database.ts` or the auth store yet (specs 19, 20).
- No component tests for the dossier primitives or game views (spec 21).
- No CI: run the checks locally (spec 30).
- Real push delivery (Expo to APNs to a phone) is untested until there is an EAS project and a device build.
- The engine simulation fast-forwards game clocks with the local service-role key; it never runs against a hosted project.

## Before you call something done

1. `yarn compile && yarn lint:check && yarn test`
2. If the database changed: `supabase db reset --local && node scripts/simulate-game.mjs` (and `node scripts/push-check.mjs` for notification changes)
3. If a screen changed: look at it on the simulator, including the empty, loading and error states.
