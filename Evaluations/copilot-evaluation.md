# Code Audit Report — Codeword App

## Executive Summary

| Metric | Value |
|---|---|
| Source files analyzed | ~90 `.ts`/`.tsx` |
| Test files | 4 (very low coverage) |
| `console.*` calls in src | 98 |
| `any` usages | 27 |
| Critical issues | 4 |
| High-priority issues | 7 |

**Overall health: 🟡 Fair** — solid foundation (Expo Router, Zustand, Supabase, Drizzle schema, theme system) but with notable security issues, dead code, pervasive debug logging, and critically thin test coverage.

**Top 3 priorities:**
1. 🔴 Hardcoded MMKV encryption key — data at rest security
2. 🔴 Debug colors shipped in `JoinGameModal` — broken UI in production
3. 🔴 Dead auth module + duplicated user-transform logic — confusion & bugs

---

## Findings by Category

### 1. Architecture & Design

#### 🔴 Critical
- **`src/lib/auth.ts` is dead code** — never imported. `src/lib/auth-client.ts` does the same thing and is the real entry point. Both wrap Supabase identically.
  - **Impact:** Confuses any developer trying to understand auth. Future changes may be applied to the wrong file.
  - **Recommendation:** Delete `src/lib/auth.ts`.

#### 🟡 Medium
- **User-transform logic duplicated 4×** — `authStore.ts` (3 locations: `signIn`, `signUp`, `refreshSession`) and `AuthProvider.tsx` each transform a Supabase user object into the app `User` shape.
  - **Impact:** Changes to the User shape must be made in 4 places; easy to miss one.
  - **Recommendation:** Extract a `mapSupabaseUser(supabaseUser) → User` helper into `src/lib/auth-client.ts` or a `src/utils/auth.ts`.

- **Screens indirection layer adds no value** — `src/screens/` contains full screen implementations while `src/app/(app)/(tabs)/*.tsx` just re-exports them. This is unnecessary double indirection for straightforward screens.
  - **Recommendation:** Either co-locate screen logic in the route files, or establish a clear rule for when the screens/ layer is warranted (e.g., complex screens shared across routes).

- **`db` object in `src/lib/database.ts` is a God Object** — 400+ line module handles every DB entity (profiles, games, user_games, words, assignments, eliminations).
  - **Recommendation:** Split into `src/lib/db/profiles.ts`, `src/lib/db/games.ts`, etc.

- **Stale Better Auth remnants** — `.env` contains `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` alongside Supabase variables. `SUPABASE_AUTH_MIGRATION.md` indicates an in-flight migration. The old auth system should be fully removed.

---

### 2. Code Quality

#### 🔴 Critical
- **Debug colors in `JoinGameModal`** — `src/components/JoinGameModal.tsx` has:
  ```ts
  const $sheet = { backgroundColor: "#FF00FF", ... }   // bright magenta
  const $content = { backgroundColor: "#00FFFF", ... } // bright cyan
  ```
  These are forgotten debug artifacts that will render in production.
  - **Recommendation:** Remove or replace with theme colors.

#### 🟡 Medium
- **98 `console.*` calls across 16 files** — many are not guarded by `__DEV__` and will log in production. `authStore.ts` signOut has 4 debug logs alone.
  - **Files with highest density:** `authStore.ts`, `database.ts`, `network-utils.ts`, `network-test.ts`, `AuthProvider.tsx`
  - **Recommendation:** Remove debug logs or wrap in `if (__DEV__)`. Use `src/utils/crashReporting.ts` for production errors.

- **Hardcoded hex colors in styles** — `GamesScreen.tsx`, `GameDetailScreen`, `JoinGameModal`, `CreateGameModal` all use raw hex values (`#f5f5f5`, `#666`, `#007AFF`, `#D32F2F`) bypassing the theme system. Dark mode will be broken for these components.
  - **Recommendation:** Use `themed()` and `colors` from `useAppTheme()`.

- **27 `any` usages despite `noImplicitAny: true`** — `@typescript-eslint/no-explicit-any: 0` in `.eslintrc.js` silences the rule entirely. Most `any` types are avoidable (`e: any` in catch blocks → use `unknown`, `as any` storage casts → use proper types).

- **`GameDetailScreen` shows wrong label for members** — `src/app/(app)/game/[id].tsx:69`:
  ```ts
  <Text preset="default" text={item.games.name} />
  ```
  `item.games` is the `Game` record, so this shows the **game name** for each member row, not the user's name. The user profile name should come from a `user_profiles` join.

#### 🟢 Low
- **`keyExtractor` uses dual-field fallback** in `GamesScreen.tsx`: `item.userId ?? item.user_id`. This hints at a camelCase/snake_case mismatch between Drizzle types and the raw Supabase response. Drizzle should be handling this mapping, but the fallback suggests it's sometimes not.

---

### 3. Security

#### 🔴 Critical
- **Hardcoded MMKV encryption key** — `src/stores/storage.ts:4`:
  ```ts
  encryptionKey: "codeword-app-key"
  ```
  A static, predictable key in source means anyone with a jailbroken device or who decompiles the app can decrypt stored session data.
  - **Recommendation:** Generate a random key per-device using `expo-crypto` or `expo-secure-store`, store it in Secure Store, and load it at init.

- **`emailVerified: true` hardcoded in 4 places** — `authStore.ts` (lines 108, 154, 219) and `AuthProvider.tsx` (line 31). Email verification is silently bypassed with a comment "Email confirmation disabled for now."
  - **Impact:** If email verification is re-enabled on the Supabase side, the client will still report all users as verified, potentially allowing unverified users access.
  - **Recommendation:** Read `emailVerified` from the actual Supabase user object (`!!data.user.email_confirmed_at`).

#### 🟡 Medium
- **Non-atomic join code uniqueness check** — `database.ts` `createGameHost`: the loop checking code uniqueness and the subsequent insert are two separate DB round-trips. Two concurrent users could get the same code.
  - **Recommendation:** Use a Postgres unique constraint on `games.code` and handle the unique violation error gracefully on retry.

- **`as any` on auth storage adapter** — `supabase/database.ts`:
  ```ts
  storage: ExpoSecureStoreAdapter as any
  ```
  Bypasses type checking on a security-sensitive interface. Use `import type { SupportedStorage } from "@supabase/supabase-js"` and type it properly.

---

### 4. Performance

#### 🟡 Medium
- **`useAuth()` selects entire store** — `src/stores/hooks.ts` `useAuth()` returns the full store state object, causing all consumers to re-render on any auth state change. More granular hooks (`useIsAuthenticated`, `useUser`, etc.) exist but screens use `useAuth()` instead.
  - **Files affected:** `GamesScreen.tsx`, `HomeScreen.tsx`, `AppLayout`, `AuthLayout`, `AuthProvider`
  - **Recommendation:** Use the specific hooks where possible.

- **`runNetworkTests()` on every game list load** — `GamesScreen.tsx:44`:
  ```ts
  if (__DEV__) { runNetworkTests().catch(() => {}) }
  ```
  `loadGames` is called on mount and after every game create/join. `runNetworkTests` fires 4 separate network requests each time.
  - **Recommendation:** Run once on app start in `AuthProvider` or remove from `loadGames`.

- **`FlatList` with `scrollEnabled={false}` inside scrollable `Screen`** — `GameDetailScreen` uses two such FlatLists inside `preset="scroll"` Screen. React Native virtualizes poorly in this pattern; list items won't be recycled.
  - **Recommendation:** Replace with plain `map()` + `View` since virtualization isn't useful when scroll is disabled, or restructure to a single FlatList.

---

### 5. Testing

#### 🔴 Critical
- **~4% test coverage** — 4 test files cover: MMKV storage utils, Text component render, API error mapping, and i18n key presence. Zero coverage for: auth flows, database operations, screen interactions, game logic.
  - **Recommendation:** At minimum, add tests for `authStore` actions (sign in/out/up), `database.ts` key functions (mock Supabase), and the `CreateGameModal`/`JoinGameModal` flows.

- **i18n test searches wrong path** — `test/i18n.test.ts:23`:
  ```ts
  const command = `grep ... -ohr './app' | ...`
  ```
  The app files are in `./src/app`, not `./app`. This test always passes vacuously (no keys found = no assertions made).
  - **Recommendation:** Change `'./app'` to `'./src/app'`.

#### 🟡 Medium
- **4 root-level manual test scripts** (`test-auth.js`, `test-db.js`, `test-profile.js`, `test-zustand.js`) — these are ad-hoc Node scripts, not integrated into `jest`. They exist alongside the real test suite, creating confusion.
  - **Recommendation:** Convert to proper Jest integration tests or delete if superseded.

- **`test/` excluded from TypeScript** in `tsconfig.json` — `"exclude": ["node_modules", "test/**/*"]`. Tests can have undetected type errors.
  - **Recommendation:** Use the separate `test/test-tsconfig.json` that already exists and ensure it extends the root config with `test/` included.

---

### 6. Maintainability

#### 🟡 Medium
- **Auth migration is incomplete** — `SUPABASE_AUTH_MIGRATION.md`, `.env` Better Auth keys, and `src/lib/auth.ts` dead code all point to an in-progress migration from Better Auth → Supabase Auth. Until completed, the codebase carries cognitive overhead and `.env` carries unnecessary secrets.

- **Root-level debug scripts** — `test-*.js` files and `NOTES_NETWORK_ISSUES.md` are development artifacts that were never cleaned up.

- **Inline StyleSheet objects (no `StyleSheet.create`)** — All style objects are plain JS objects. While not strictly wrong in modern RN, they miss the identity-check optimization and won't be validated by the RN style type system.

---

## Prioritized Action Plan

### Quick Wins (< 1 day)
1. **Fix `JoinGameModal` debug colors** — remove `#FF00FF`/`#00FFFF` backgrounds (`JoinGameModal.tsx`)
2. **Delete `src/lib/auth.ts`** — dead code causing confusion
3. **Fix i18n test path** — change `'./app'` → `'./src/app'` in `test/i18n.test.ts`
4. **Fix `emailVerified`** — read from `!!user.email_confirmed_at` instead of hardcoding `true`
5. **Remove root-level `test-*.js` scripts** or move into the test suite

### Medium-term (1–5 days)
6. **Extract `mapSupabaseUser()` helper** — eliminate 4× duplicated user transform
7. **Secure MMKV encryption key** — generate per-device via `expo-crypto` + SecureStore
8. **Add `console.*` guards** — wrap debug logs in `__DEV__` or remove them
9. **Replace hardcoded theme colors** in `GamesScreen`, `GameDetailScreen`, modals
10. **Fix `GameDetailScreen` member display** — show user name, not game name
11. **Add DB unique constraint** on `games.code` + handle collision gracefully
12. **Move network test calls** out of `loadGames` (run once on startup)

### Long-term (> 5 days)
13. **Add meaningful test coverage** — auth store unit tests, screen integration tests, db mock tests
14. **Split `db` God Object** into per-entity modules
15. **Complete Better Auth → Supabase migration** — remove Better Auth env vars and dead code
16. **Adopt granular Zustand selectors** throughout the app (use `useIsAuthenticated`, `useUser` etc. instead of `useAuth()` everywhere)
17. **Restructure `screens/` vs `app/` layers** — decide on a consistent pattern
