# Codeword

A companion app for **Word Assassins**, the party game where you win by getting people to say the wrong word.

Join an operation with a six-character code and you're secretly assigned a target and a set of codewords. Get your target to say any of your words, then file a kill report. If they confirm it, they're out and you take their target and all their codewords. Every day of the operation each agent is issued one more word, and the words get easier as the game goes on. The last agent standing wins.

Built with React Native 0.79 / Expo SDK 53 (Ignite boilerplate) and Supabase, with the game rules running as Postgres functions. The look is a "spy dossier": paper, manila folders and red rubber stamps.

## Run it

You need Node 20, Yarn 1, Docker Desktop, the Supabase CLI and Xcode 26.

```bash
yarn install
supabase start            # local backend in Docker; applies all migrations
```

Create `.env.local` with the URL and anon key that `supabase status` prints:

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key>
NETWORK_CHECKS_ENABLED=0
```

Then build the dev client once and start Metro:

```bash
yarn ios
yarn start
```

Full steps and troubleshooting: [docs/development/local-setup.md](docs/development/local-setup.md).

## Play a game by yourself

```bash
node scripts/agent.mjs alice create "Office Showdown"   # prints a code
node scripts/agent.mjs bob join <CODE>
node scripts/agent.mjs priya join <CODE>
```

Sign in as `alice@codeword.test` / `codeword-dev-1`, open the operation and start it. Then act as the others from the terminal, e.g. `node scripts/agent.mjs bob report <CODE>` to see a report land on whoever Bob is hunting.

## Check it

```bash
yarn compile && yarn lint:check && yarn test
node scripts/simulate-game.mjs     # plays full games against the local backend and checks every rule
```

See the [testing matrix](docs/development/testing-matrix.md).

## Where things are

| Looking for | Go to |
|---|---|
| How it works, how to work on it | [`docs/`](docs/README.md) |
| Product requirements and vocabulary | [`specs/`](specs/), especially [`specs/glossary.md`](specs/glossary.md) |
| Rules for coding agents | [`CLAUDE.md`](CLAUDE.md) |
| The design | Claude Design project "Codeword — Spy Dossier", mapped in [`docs/development/design-system.md`](docs/development/design-system.md) |
| Plans and scoped work specs (historical) | `MainPlans/`, `VerifiedSpecs/`, `ClaudePlans/` |

## Status

Playable end to end on the iOS simulator against a local backend. Not yet built: push notifications, realtime updates (the game screen polls), a hosted Supabase project, release builds, and an Android pass. The upgrade and cleanup backlog is in [`VerifiedSpecs/00-INDEX.md`](VerifiedSpecs/00-INDEX.md).
