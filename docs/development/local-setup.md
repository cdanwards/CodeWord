# Local setup

This gets you from a fresh clone to the app running on an iOS simulator against a local backend.

## Prerequisites

| Tool | Version used | Notes |
|---|---|---|
| Node | 20 (`.tool-versions`) | `engines` requires 20+ |
| Yarn | 1.22 | The repo uses `yarn.lock` |
| Docker Desktop | any recent | Runs the local Supabase stack |
| Supabase CLI | 2.24+ | `brew install supabase/tap/supabase` |
| Xcode | 26.x | With an iOS 26 simulator |
| CocoaPods | 1.16 | Needs a UTF-8 locale (below) |

## 1. Install

```bash
yarn install
```

## 2. Start the backend

```bash
supabase start
```

The first run downloads images and applies every migration. It prints the API URL and keys; get them again any time with `supabase status`.

## 3. Point the app at it

Create `.env.local` (gitignored; Expo loads it ahead of `.env`):

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<the "anon key" from supabase status>
NETWORK_CHECKS_ENABLED=0
```

On an Android emulator use `http://10.0.2.2:54321`.

## 4. Build the dev client (once, and after native changes)

```bash
npx expo prebuild --clean --platform ios
cd ios && LANG=en_US.UTF-8 pod install && cd ..
yarn ios
```

`yarn ios` (`expo run:ios`) builds, installs and launches. Rebuild only when native dependencies or `app.json` / `app.config.ts` change; JavaScript changes just need Metro.

## 5. Run Metro

```bash
yarn start
```

Open the CodewordApp dev client on the simulator. If changes stop hot-reloading, relaunch the app.

## 6. Sign in

Use a test agent, `alice@codeword.test` / `codeword-dev-1` (any `scripts/agent.mjs` command creates the account, e.g. `node scripts/agent.mjs alice create "Test op"`), or create an account on the Enlist screen.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Build fails in `fmt/format.cc` with "call to consteval function … is not a constant expression" | Xcode 26 vs React Native 0.79's `fmt`. `plugins/withFmtXcode26Fix.ts` compiles that pod as C++17; make sure prebuild ran so the Podfile has the patch. Remove the plugin after upgrading Expo (spec 08). |
| `pod install` fails with "Unicode Normalization not appropriate for ASCII-8BIT" | Run it with `LANG=en_US.UTF-8`. |
| App shows signed in but every request fails, "violates foreign key constraint user_profiles_user_id_fkey" | Your stored session belongs to a user that no longer exists (e.g. after `supabase db reset`). Sign out and back in. |
| Games list is empty on the simulator | `NETWORK_CHECKS_ENABLED` must be `0` locally; with checks on, a failed connectivity probe makes reads use an empty fallback. |
| "Use Strong Password?" sheet swallows typing on Enlist | iOS autofill on the simulator. Dismiss it with ✕ first. |
| Docker isn't running | `open -a Docker`, wait, then `supabase start`. |
| Auth returns 502 after `supabase db reset` | The gateway kept the old auth container: `docker restart supabase_kong_CodeWord`. |
