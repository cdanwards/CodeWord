# Spec 08: Expo SDK 53 -> 55 Upgrade

**Phase:** 3 (Core Platform Upgrade)
**Priority:** High — foundational for all subsequent work
**Effort:** 2-3 days
**Dependencies:** Specs 01-07 (all Phase 1 + Phase 2 work)
**Blocked by:** Phase 2 completion

---

## Objective

Upgrade from Expo SDK 53 (React Native 0.79.5) to Expo SDK 55 (React Native 0.83.x). This is the highest-risk phase — it touches ~25 packages and requires a native rebuild.

**Key risk mitigator:** This project has zero direct Reanimated imports in `src/`. Reanimated is only used transitively by `@gorhom/bottom-sheet` and as a Babel plugin. This significantly reduces the Reanimated 3->4 migration risk.

---

## Step 1: Run Expo Upgrade Tool

```bash
npx expo install expo@^55 --fix
```

This auto-updates:
- `expo` (53 -> 55)
- All `expo-*` packages to SDK 55 compatible versions
- `react-native` (0.79.5 -> 0.83.x)
- `react-native-reanimated` (3.17.4 -> 4.x)
- `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context`
- `react-native-web`
- `jest-expo`, `eslint-config-expo`, `@expo/metro-runtime`

---

## Step 2: Manually Update Remaining Packages

These packages aren't managed by `npx expo install --fix`:

### Runtime Dependencies
| Package | From | To |
|---------|------|----|
| `react` | 19.0.0 | 19.2.x |
| `react-dom` | 19.0.0 | 19.2.x |
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

### Dev Dependencies
| Package | From | To |
|---------|------|----|
| `@types/react` | ~19.0.10 | ~19.2.x |
| `@babel/core` | ^7.20.0 | ^7.29.x |
| `@babel/preset-env` | ^7.20.0 | ^7.29.x |
| `@babel/runtime` | ^7.20.0 | ^7.29.x |
| `@testing-library/react-native` | ^13.2.0 | ^13.3.x |
| `drizzle-kit` | ^0.31.4 | ^0.31.10 |
| `prettier` | ^3.3.3 | ^3.8.x |
| `ts-jest` | ^29.1.1 | ^29.4.x |
| `eslint-plugin-prettier` | ^5.2.1 | ^5.5.x |
| `eslint-plugin-reactotron` | ^0.1.2 | ^0.1.9 |
| `reactotron-core-client` | ^2.9.4 | ^2.9.9 |
| `reactotron-react-js` | ^3.3.11 | ^3.3.17 |
| `reactotron-react-native` | ^5.0.5 | ^5.1.x |
| `reactotron-react-native-mmkv` | ^0.2.6 | ^0.2.9 |

---

## Step 3: Config File Audit

Check each config file for deprecated or graduated options:

### `app.json`
- `newArchEnabled` — may be unnecessary (New Architecture is default in RN 0.83+)
- `jsEngine: "hermes"` — may be unnecessary (Hermes is default)
- `experiments.tsconfigPaths` / `experiments.typedRoutes` — check if graduated to stable

### `app.config.ts`
- `ts-node/register` pattern — verify still works with TS 5.8+
- `plugins/withSplashScreen.ts` — verify config plugin APIs (`withStringsXml`, `withAndroidStyles`) still exist in SDK 55

### `metro.config.js`
- `resolver.unstable_conditionNames` — may have changed naming
- `.cjs` extension workaround — may no longer be needed

### `babel.config.js`
- `react-native-reanimated/plugin` — verify path exists in Reanimated v4 (may have moved)

### `supabase/database.ts`
- `import "react-native-url-polyfill/auto"` — RN 0.83 may include native URL support. Test if removing this import breaks Supabase. (Full removal is Spec 11.)

---

## Step 4: Clean Install + Verification

```bash
rm -rf node_modules yarn.lock
yarn install
npx expo install --fix
```

### Automated checks:
```bash
yarn compile        # No new type errors
yarn lint:check     # No new lint errors
yarn test           # All tests pass
npx expo start      # Dev server starts
```

### Manual smoke test:
- `npx expo run:ios` — builds and runs on simulator
- Login flow: enter credentials -> navigate to home
- Games tab: view game list -> create game -> verify in list
- Profile tab: view profile
- Sign out: verify redirect to auth screen
- Bottom sheets: verify `CreateGameModal` and `JoinGameModal` open/close correctly (Reanimated 4 transition)

---

## Files Likely Needing Manual Fixes

| File | Potential Issue |
|------|----------------|
| `babel.config.js` | Reanimated plugin path |
| `metro.config.js` | Resolver config changes |
| `app.json` / `app.config.ts` | Graduated experiments |
| `plugins/withSplashScreen.ts` | Config plugin API changes |
| `src/components/*.tsx` using BottomSheet | API changes in `@gorhom/bottom-sheet` 5.2.x |

---

## Acceptance Criteria

- [ ] `expo` is at ^55.x
- [ ] `react-native` is at 0.83.x
- [ ] `react-native-reanimated` is at 4.x
- [ ] All other dependencies updated per the table above
- [ ] `yarn compile` — zero type errors
- [ ] `yarn lint:check` — no new lint errors
- [ ] `yarn test` — all tests pass
- [ ] `npx expo start` — dev server starts without errors
- [ ] App builds and runs on iOS Simulator
- [ ] Login -> Games -> Create Game -> Join Game -> Profile -> Sign Out all work
- [ ] Bottom sheet modals animate correctly (Reanimated 4)
- [ ] No console errors related to deprecated APIs

---

## Rollback Plan

If the upgrade causes irrecoverable issues:
1. `git stash` or `git checkout -- .`
2. `rm -rf node_modules yarn.lock && yarn install`
3. File specific issues with the packages that broke

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Reanimated 4 breaks BottomSheet | Low (transitive only) | Check @gorhom/bottom-sheet 5.2.x changelog for Reanimated 4 compat |
| RN 0.83 changes break metro | Medium | Review RN 0.83 changelog for metro config changes |
| Expo SDK 55 drops a plugin API | Low | Check Expo changelog before upgrading |
| Type errors from updated @types/react | Medium | Fix incrementally — usually minor |
