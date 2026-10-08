# Upgrade All Dependencies to Latest Versions

## Context

CodewordApp is on Expo SDK 53 (React Native 0.79.5, React 19.0.0). The latest stable Expo SDK is **55** (Expo skipped SDK 54). Nearly every dependency has updates available, including 24 with major version bumps. This plan upgrades everything to the latest compatible versions using a phased approach that keeps changes isolated and debuggable.

**Approach:** Expo SDK upgrade first (it pins ~25 packages), then independent library upgrades, then toolchain upgrades. Each phase is a separate commit/PR so failures can be attributed to a specific change.

---

## Current vs Latest Version Matrix

### Dependencies

| Package | Current | Latest | Change Type |
|---------|---------|--------|-------------|
| `expo` | ^53.0.15 | 55.0.12 | **Major (SDK 55)** |
| `react` | 19.0.0 | 19.2.5 | Minor |
| `react-dom` | 19.0.0 | 19.2.5 | Minor |
| `react-native` | 0.79.5 | 0.83.4 (SDK 55) | **Major** |
| `expo-router` | ~5.1.2 | 55.0.11 | **Major** |
| `expo-constants` | ^17.1.7 | 55.x | **Major** |
| `expo-font` | ~13.3.0 | 55.x | **Major** |
| `expo-linking` | ~7.1.4 | 55.x | **Major** |
| `expo-localization` | ~16.1.5 | 55.x | **Major** |
| `expo-secure-store` | ^14.2.3 | 55.x | **Major** |
| `expo-splash-screen` | ~0.30.9 | 55.x | **Major** |
| `expo-system-ui` | ~5.0.9 | 55.x | **Major** |
| `expo-build-properties` | ~0.14.6 | 55.x | **Major** |
| `expo-dev-client` | ~5.2.1 | 55.x | **Major** |
| `@expo/metro-runtime` | ~5.0.4 | 55.x | **Major** |
| `react-native-reanimated` | ~3.17.4 | 4.2.x | **Major** |
| `react-native-mmkv` | ^3.3.0 | 4.3.1 | **Major** |
| `@shopify/flash-list` | 1.8.1 | 2.3.1 | **Major** |
| `i18next` | ^23.14.0 | 26.0.4 | **Major** |
| `react-native-url-polyfill` | ^2.0.0 | 3.0.0 | **Major** |
| `react-native-gesture-handler` | ~2.24.0 | 2.31.0 | Minor |
| `react-native-screens` | ~4.11.1 | 4.24.0 | Minor |
| `react-native-safe-area-context` | 5.4.0 | 5.7.0 | Minor |
| `react-native-web` | ^0.20.0 | 0.21.2 | Minor |
| `react-native-keyboard-controller` | ^1.12.7 | 1.21.4 | Minor |
| `react-native-edge-to-edge` | 1.6.0 | 1.8.1 | Minor |
| `react-native-drawer-layout` | ^4.0.1 | 4.2.2 | Minor |
| `@react-navigation/native` | ^7.0.14 | 7.2.2 | Minor |
| `@react-navigation/native-stack` | ^7.2.0 | 7.14.10 | Minor |
| `@gorhom/bottom-sheet` | ^5.1.8 | 5.2.9 | Minor |
| `@supabase/supabase-js` | ^2.52.0 | 2.102.1 | Minor |
| `@expo-google-fonts/space-grotesk` | ^0.4.0 | 0.4.1 | Patch |
| `apisauce` | 3.1.1 | 3.2.2 | Minor |
| `dotenv` | ^17.2.0 | 17.4.1 | Minor |
| `drizzle-orm` | ^0.44.3 | 0.45.2 | Minor |
| `zod` | ^4.0.5 | 4.3.6 | Minor |
| `zustand` | ^5.0.6 | 5.0.12 | Patch |
| `react-i18next` | ^15.0.1 | latest | Check compat |
| `date-fns` | ^4.1.0 | 4.1.0 | Up to date |
| `intl-pluralrules` | ^2.0.1 | 2.0.1 | Up to date |

### Dev Dependencies

| Package | Current | Latest | Change Type |
|---------|---------|--------|-------------|
| `eslint` | ^8.57.0 | 10.2.0 | **Major** |
| `typescript` | ~5.8.3 | 6.0.2 | **Major** |
| `jest` | ~29.7.0 | 30.3.0 | **Major** |
| `babel-jest` | ^29.2.1 | 30.3.0 | **Major** |
| `@types/jest` | ^29.5.14 | 30.0.0 | **Major** |
| `eslint-config-prettier` | ^9.1.0 | 10.1.8 | **Major** |
| `eslint-plugin-react-native` | ^4.1.0 | 5.0.0 | **Major** |
| `jest-expo` | ~53.0.7 | 55.x | **Major** |
| `eslint-config-expo` | ~9.2.0 | 55.x | **Major** |
| `@babel/core` | ^7.20.0 | 7.29.0 | Minor |
| `@babel/preset-env` | ^7.20.0 | 7.29.2 | Minor |
| `@babel/runtime` | ^7.20.0 | 7.29.2 | Minor |
| `@types/react` | ~19.0.10 | 19.2.14 | Minor |
| `@testing-library/react-native` | ^13.2.0 | 13.3.3 | Minor |
| `drizzle-kit` | ^0.31.4 | 0.31.10 | Patch |
| `prettier` | ^3.3.3 | 3.8.1 | Minor |
| `eslint-plugin-prettier` | ^5.2.1 | 5.5.5 | Minor |
| `eslint-plugin-reactotron` | ^0.1.2 | 0.1.9 | Patch |
| `reactotron-core-client` | ^2.9.4 | 2.9.9 | Patch |
| `reactotron-react-js` | ^3.3.11 | 3.3.17 | Patch |
| `reactotron-react-native` | ^5.0.5 | 5.1.18 | Minor |
| `reactotron-react-native-mmkv` | ^0.2.6 | 0.2.9 | Patch |
| `ts-jest` | ^29.1.1 | 29.4.9 | Minor |
| `drizzle-zod` | ^0.8.3 | 0.8.3 | Up to date |
| `ts-node` | ^10.9.2 | 10.9.2 | Up to date |

---

## Phase 0: Pre-Upgrade Baseline

1. Verify current state passes: `yarn compile && yarn lint:check && yarn test`
2. Commit any uncommitted changes
3. Create upgrade branch from current branch

---

## Phase 1: Expo SDK 53 → 55 (Atomic — all must change together)

This is the centerpiece. Expo pins react, react-native, and all expo-* packages.

### 1a. Run Expo upgrade tool

```bash
npx expo install expo@^55 --fix
```

This auto-updates: expo, all expo-* packages, react-native, react-native-gesture-handler, react-native-safe-area-context, react-native-screens, react-native-reanimated (3→4), react-native-web, jest-expo, eslint-config-expo, @expo/metro-runtime.

### 1b. Manually update remaining pinned packages

| Package | From | To |
|---------|------|----|
| `react` | 19.0.0 | 19.2.x |
| `react-dom` | 19.0.0 | 19.2.x |
| `@types/react` | ~19.0.10 | ~19.2.x |
| `@react-navigation/native` | ^7.0.14 | ^7.2.x |
| `@react-navigation/native-stack` | ^7.2.0 | ^7.14.x |
| `react-native-drawer-layout` | ^4.0.1 | ^4.2.x |
| `react-native-edge-to-edge` | 1.6.0 | 1.8.x |
| `react-native-keyboard-controller` | ^1.12.7 | ^1.21.x |
| `@expo-google-fonts/space-grotesk` | ^0.4.0 | ^0.4.1 |
| `@gorhom/bottom-sheet` | ^5.1.8 | ^5.2.x |
| `@supabase/supabase-js` | ^2.52.0 | ^2.102.x |
| `apisauce` | 3.1.1 | 3.2.x |
| `dotenv` | ^17.2.0 | ^17.4.x |
| `drizzle-orm` | ^0.44.3 | ^0.45.x |
| `zod` | ^4.0.5 | ^4.3.x |
| `zustand` | ^5.0.6 | ^5.0.12 |
| `@babel/core` | ^7.20.0 | ^7.29.x |
| `@babel/preset-env` | ^7.20.0 | ^7.29.x |
| `@babel/runtime` | ^7.20.0 | ^7.29.x |
| `drizzle-kit` | ^0.31.4 | ^0.31.10 |
| `prettier` | ^3.3.3 | ^3.8.x |
| `reactotron-core-client` | ^2.9.4 | ^2.9.9 |
| `reactotron-react-js` | ^3.3.11 | ^3.3.17 |
| `reactotron-react-native` | ^5.0.5 | ^5.1.x |
| `reactotron-react-native-mmkv` | ^0.2.6 | ^0.2.9 |
| `ts-jest` | ^29.1.1 | ^29.4.x |
| `eslint-plugin-prettier` | ^5.2.1 | ^5.5.x |
| `eslint-plugin-reactotron` | ^0.1.2 | ^0.1.9 |
| `@testing-library/react-native` | ^13.2.0 | ^13.3.x |

### 1c. Config file updates to check

| File | What to verify |
|------|---------------|
| `app.json` | `newArchEnabled` may be unnecessary (default in RN 0.83+). `jsEngine: "hermes"` may be unnecessary. Check if `experiments.tsconfigPaths` / `experiments.typedRoutes` graduated. |
| `app.config.ts` | `ts-node/register` pattern still works. `plugins/withSplashScreen.ts` config plugin APIs (`withStringsXml`, `withAndroidStyles`) still exist. |
| `metro.config.js` | `resolver.unstable_conditionNames` may have changed. `.cjs` extension workaround may no longer be needed. |
| `babel.config.js` | Verify `react-native-reanimated/plugin` path still exists in Reanimated v4. |
| `supabase/database.ts` | `react-native-url-polyfill/auto` import — may no longer be needed with RN 0.83. |

### 1d. Clean install

```bash
rm -rf node_modules yarn.lock
yarn install
npx expo install --fix
```

### 1e. Verification

- `yarn compile` — no new type errors
- `yarn lint:check` — no new lint errors
- `yarn test` — all tests pass
- `npx expo start` — dev server starts
- `npx expo run:ios` — builds and runs on simulator
- Manual smoke test: login → home → games tab → profile tab → sign out

---

## Phase 2: Independent Library Upgrades (separate commits, after Phase 1)

### 2a. `react-native-mmkv` 3.3.0 → 4.x

**Risk: Medium** — 2 files use MMKV directly.

Files to update:
- `src/stores/storage.ts` — Zustand persistence adapter (MMKV constructor, `.set()`, `.getString()`, `.delete()`)
- `src/utils/storage/index.ts` — General key-value wrapper (same methods)
- Check `reactotron-react-native-mmkv` compatibility with MMKV v4

Verify: `yarn test`, then manual test of auth persistence (kill app, reopen, still logged in).

### 2b. `@shopify/flash-list` 1.8.1 → 2.x

**Risk: Low** — only 1 file.

Files to update:
- `src/components/ListView.tsx` — imports `FlashList` and `FlashListProps`
- Keep `expo.install.exclude` for `@shopify/flash-list` in `package.json`

Verify: Manual test of Games list screen.

### 2c. `i18next` 23.x → 26.x

**Risk: Medium-High** — 3 major versions of accumulated breaking changes.

Strategy: Upgrade incrementally (23→24→25→26), verifying at each step. Also update `react-i18next` to latest compatible.

Files to update:
- `src/i18n/index.ts` — initialization config
- `src/i18n/translate.ts` — translation helper
- `test/setup.ts` — i18next mocks
- `test/i18n.test.ts` — i18n tests

Verify: `yarn test`, manual check translations render on all screens.

### 2d. `react-native-url-polyfill` 2.x → 3.x (or remove)

**Risk: Low** — 1 side-effect import.

Files to update:
- `supabase/database.ts` — `import "react-native-url-polyfill/auto"`
- If RN 0.83 includes native URL support, remove the package entirely

Verify: `yarn test:supabase`, manual test Supabase auth flow.

---

## Phase 3: Toolchain Upgrades (separate commits, independent of Phase 2)

### 3a. ESLint 8.x → 9+ (Flat Config Migration)

**Risk: Medium** — extensive custom `.eslintrc.js` config.

Strategy: Migrate to flat config (`eslint.config.mjs`). Use `@eslint/eslintrc` FlatCompat if needed for plugins that don't support flat config yet.

Files to update:
- Delete `.eslintrc.js`, create `eslint.config.mjs`
- Update `eslint-config-prettier` 9→10
- Update `eslint-plugin-react-native` 4→5
- Update `.eslintignore` → move ignore patterns into flat config

Verify: `yarn lint:check` produces same or fewer warnings.

### 3b. TypeScript 5.8 → 6.x (if released and stable)

**Risk: Medium** — may surface new type errors.

**Important:** Verify `expo/tsconfig.base` (extended by this project) supports TS 6 before attempting. If not supported yet, defer this upgrade.

Files to update:
- `tsconfig.json` — check for deprecated options
- `test/test-tsconfig.json`

Verify: `yarn compile` with zero errors.

### 3c. Jest 29 → 30 (only if jest-expo supports it)

**Risk: Low-Medium** — small test suite.

**Important:** Check `jest-expo@~55` peer dependency. If it requires Jest 29, this upgrade must wait.

Files to update:
- `jest.config.js`
- `@types/jest` → 30.x
- `babel-jest` → 30.x
- `test/setup.ts` — if mock APIs changed

Verify: `yarn test` — all tests pass.

---

## Phase 4: Post-Upgrade Cleanup

1. Remove `react-native-url-polyfill` if no longer needed
2. Remove `newArchEnabled` and `jsEngine` from `app.json` if now defaults
3. Audit `plugins/withSplashScreen.ts` — remove if expo/expo#16084 is fixed in SDK 55
4. Remove leftover Better Auth artifacts (not part of upgrade but good housekeeping)
5. Full EAS build on both platforms
6. Run Maestro E2E tests

---

## Commit/PR Sequence

```
PR 1: Expo SDK 53 → 55 + all pinned dependencies (Phase 0 + 1)
  ├── PR 2a: MMKV 3 → 4
  ├── PR 2b: FlashList 1 → 2
  ├── PR 2c: i18next 23 → 26
  ├── PR 2d: url-polyfill 2 → 3 (or remove)
  ├── PR 3a: ESLint flat config migration
  ├── PR 3b: TypeScript 6 (if supported)
  └── PR 3c: Jest 30 (if jest-expo supports it)
PR 4: Post-upgrade cleanup
```

Phase 2 and 3 PRs can be worked on in parallel after Phase 1 merges.

---

## Risk Assessment Summary

| Phase | Risk | Rationale |
|-------|------|-----------|
| Phase 1 (Expo SDK) | **High** | Touches ~25 packages, requires native rebuild, RN 0.79→0.83 is a big jump |
| Phase 2a (MMKV) | Medium | 2 files, but affects auth persistence |
| Phase 2b (FlashList) | Low | 1 file, simple component wrapper |
| Phase 2c (i18next) | Medium-High | 3 major versions, touches i18n across app |
| Phase 2d (url-polyfill) | Low | 1 import, may just be removed |
| Phase 3a (ESLint) | Medium | Full config format migration |
| Phase 3b (TypeScript) | Medium | May not be supported by Expo yet |
| Phase 3c (Jest) | Low-Medium | May not be supported by jest-expo yet |

**Key insight:** Reanimated 3→4 is normally high risk, but this project has **zero direct Reanimated imports** in `src/` — it's only used transitively by `@gorhom/bottom-sheet` and as a Babel plugin. This significantly reduces Phase 1 risk.
