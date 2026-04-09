# Spec 09: react-native-mmkv 3 -> 4 Upgrade

**Phase:** 4a (Independent Library Upgrade)
**Priority:** Medium
**Effort:** 2-4 hours
**Dependencies:** Spec 08 (Expo SDK 55), Spec 03 (MMKV encryption hardening)
**Blocked by:** Phase 3 completion

---

## Objective

Upgrade `react-native-mmkv` from 3.3.0 to 4.x. Coordinate with the encryption key hardening from Spec 03 — both modify MMKV initialization in `src/stores/storage.ts`.

---

## Files That Use MMKV Directly

| File | Usage |
|------|-------|
| `src/stores/storage.ts` | MMKV constructor, `.set()`, `.getString()`, `.delete()` |
| `src/utils/storage/index.ts` | General key-value wrapper using same MMKV methods |
| `reactotron-react-native-mmkv` | Dev dependency — check compatibility with MMKV v4 |

---

## Upgrade Steps

### 1. Update package
```bash
yarn add react-native-mmkv@^4
```

### 2. Check for API changes

Review the [MMKV v4 changelog](https://github.com/mrousavy/react-native-mmkv/releases) for:
- Constructor API changes
- Method renames (`.set()`, `.getString()`, `.delete()`)
- New required configuration
- Removed features

### 3. Update `src/stores/storage.ts`

Apply any API changes to the MMKV constructor and the `zustandStorage` adapter methods. Since Spec 03 may have already refactored this file for encryption key hardening, work from the post-Spec-03 state.

### 4. Update `src/utils/storage/index.ts`

Apply same API changes to the general storage wrapper.

### 5. Check Reactotron compatibility

```bash
yarn add reactotron-react-native-mmkv@latest
```

If `reactotron-react-native-mmkv` doesn't support MMKV v4 yet, check if there's a beta or if it can be temporarily removed from the Reactotron setup.

### 6. Rebuild native modules
```bash
npx expo run:ios
```

MMKV is a native module — requires a native rebuild after upgrading.

---

## Verification

- [ ] `yarn compile` — no type errors
- [ ] `yarn test` — all tests pass (especially `src/utils/storage/storage.test.ts`)
- [ ] Manual: Sign in -> kill app -> reopen -> still authenticated (persistence works)
- [ ] Manual: Create a game -> kill app -> reopen -> game still in list (Zustand persistence works)
- [ ] Manual: Reactotron MMKV plugin still shows stored values (if applicable)

---

## Risks

- **Native rebuild required:** Can't test in Expo Go after this — must use dev client or `expo run:ios`.
- **Reactotron compat:** `reactotron-react-native-mmkv` may lag behind MMKV major versions.
- **Coordination with Spec 03:** If MMKV initialization changed for encryption hardening, ensure the v4 API is compatible with that pattern.
