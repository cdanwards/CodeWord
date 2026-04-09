# Spec 24: Post-Upgrade Cleanup & Platform Verification

**Phase:** 8.4 + 8.5 (Final Polish)
**Priority:** Medium
**Effort:** 1-2 days
**Dependencies:** All previous specs
**Blocked by:** Phase 7 completion

---

## Objective

Final cleanup of deprecated config, removal of unnecessary polyfills, and full platform verification to confirm everything works end-to-end.

---

## Part A: Config Cleanup

### 1. Remove `react-native-url-polyfill` (if safe)

**Condition:** Only if RN 0.83 (from Spec 08) includes native URL support AND Spec 11 confirmed it's safe to remove.

**Action:**
- Remove `import "react-native-url-polyfill/auto"` from `supabase/database.ts`
- `yarn remove react-native-url-polyfill`

### 2. Clean up `app.json` defaults

**Condition:** Only if Expo SDK 55 makes these the default.

| Setting | Remove if... |
|---------|-------------|
| `"newArchEnabled": true` | New Architecture is default in RN 0.83+ |
| `"jsEngine": "hermes"` | Hermes is the only supported engine |
| `experiments.tsconfigPaths` | Graduated to stable config |
| `experiments.typedRoutes` | Graduated to stable config |

### 3. Audit `plugins/withSplashScreen.ts`

Check if the custom splash screen config plugin is still needed in SDK 55. Expo may have fixed the underlying issue that required it.

### 4. Resolve screens/ vs app/ indirection

**Current state:** `src/screens/` contains full screen implementations, while `src/app/(app)/(tabs)/*.tsx` re-exports them.

**Decision needed:** Document the convention or collapse the indirection:
- **Option A:** Keep the pattern, document why (screens can be used in multiple routes)
- **Option B:** Move screen logic into route files if no screen is reused

### 5. Remove stale network debugging code

| Item | File | Action |
|------|------|--------|
| `DEV_TEST_NETWORK` flag | `src/screens/GamesScreen.tsx` | Remove if `__DEV__` gating was added in Spec 18 |
| `NOTES_NETWORK_ISSUES.md` | Project root | Archive to `docs/` or delete if the issues are resolved |
| `src/lib/network-test.ts` | `src/lib/` | Evaluate if still needed; if kept, ensure gated behind `__DEV__` |

---

## Part B: Full Platform Verification

### Automated Checks
```bash
yarn compile          # Zero type errors
yarn lint:check       # Zero lint errors
yarn test --coverage  # All tests pass, coverage meets thresholds
```

### iOS Build & Test
```bash
npx expo run:ios
```

Manual test the complete flow:
- [ ] App launches without errors
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Sign up creates new account
- [ ] Games tab shows game list (or empty state with clear messaging)
- [ ] Create game: fill form -> submit -> game appears in list
- [ ] Join game: enter code -> submit -> game appears in list
- [ ] Game detail: shows game info, member list with names, words
- [ ] Profile tab: shows user info
- [ ] Sign out: redirects to auth screen
- [ ] Bottom sheet modals open/close smoothly
- [ ] No console errors in Metro terminal
- [ ] Dark mode (if applicable): all screens use theme colors

### Android Build & Test
```bash
npx expo run:android
```

Run the same manual test flow as iOS.

### EAS Build (Production-like)
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Maestro E2E
```bash
maestro test .maestro/flows/
```

All flows from Spec 22 should pass.

---

## Part C: Final Audit Checklist

Run through the success criteria from the unified plan:

- [ ] Zero critical security vulnerabilities (MMKV key, RLS policies, email verification)
- [ ] On Expo SDK 55 with all dependencies at latest compatible versions
- [ ] No dead code or legacy artifacts from Better Auth migration
- [ ] `src/lib/database.ts` split into domain-specific modules
- [ ] Typed `Result<T>` error returns from all data operations
- [ ] Meaningful test coverage for auth, game creation, game joining, domain validation
- [ ] At least 3 Maestro E2E flows
- [ ] Accurate coverage reporting with `collectCoverageFrom` configured
- [ ] All console logging gated behind `__DEV__`
- [ ] All UI colors using the theme system
- [ ] Project documentation (CLAUDE.md, README, glossary)
- [ ] `yarn compile && yarn lint:check && yarn test` passes with zero errors
- [ ] Builds successfully on both iOS and Android

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/database.ts` | Possibly remove url-polyfill import |
| `app.json` | Possibly remove graduated/default settings |
| `plugins/withSplashScreen.ts` | Possibly remove if no longer needed |
| `package.json` | Possibly remove url-polyfill dependency |

---

## Acceptance Criteria

- [ ] All items in the Final Audit Checklist pass
- [ ] Both iOS and Android builds succeed
- [ ] Full manual test pass on both platforms
- [ ] Maestro E2E flows pass
- [ ] No unnecessary packages, config, or dead code remains

---

## Risks

- **Platform-specific issues:** Something may work on iOS but not Android (or vice versa). Test both early.
- **EAS build differences:** Dev builds and EAS builds may behave differently due to bundling. Test with a preview profile.
