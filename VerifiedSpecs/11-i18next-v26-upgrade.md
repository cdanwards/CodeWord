# Spec 11: i18next 23 -> 26 Upgrade

**Phase:** 4c (Independent Library Upgrade)
**Priority:** Medium-High risk
**Effort:** 1-2 days
**Dependencies:** Spec 08 (Expo SDK 55)
**Blocked by:** Phase 3 completion

---

## Objective

Upgrade `i18next` from 23.x to 26.x (3 major versions) and `react-i18next` to the latest compatible version. This is the highest-risk library upgrade due to accumulated breaking changes.

---

## Strategy: Incremental Upgrade

Upgrade one major version at a time, verifying at each step:
1. 23.x -> 24.x (verify)
2. 24.x -> 25.x (verify)
3. 25.x -> 26.x (verify)

At each step: `yarn compile && yarn test`, then manual check that translations render.

---

## Files That Use i18next

| File | Usage |
|------|-------|
| `src/i18n/index.ts` | i18next initialization config |
| `src/i18n/translate.ts` | Translation helper function |
| `src/i18n/en.ts` (and other locale files) | Translation data |
| `test/setup.ts` | i18next mocks |
| `test/i18n.test.ts` | i18n key validation test |
| All components using `tx` prop | Indirect — via the `Text` component's translation support |

---

## Known Breaking Changes to Watch For

### i18next 24.x
- Check for changes to `init()` options
- `compatibilityJSON` setting may be required
- Plural handling changes

### i18next 25.x
- Check for TypeScript type changes
- Module resolution changes

### i18next 26.x
- Check for removed deprecated APIs
- `interpolation` config changes

---

## Upgrade Steps

### 1. Upgrade i18next incrementally
```bash
# Step 1
yarn add i18next@^24
yarn compile && yarn test
# Manual check translations

# Step 2
yarn add i18next@^25
yarn compile && yarn test

# Step 3
yarn add i18next@^26
yarn compile && yarn test
```

### 2. Upgrade react-i18next
```bash
yarn add react-i18next@latest
```

### 3. Update initialization config

**File:** `src/i18n/index.ts`

Apply any required config changes from the changelogs. Common changes:
- `compatibilityJSON: "v4"` may need to become `"v5"`
- `interpolation.escapeValue` default changes
- New required options

### 4. Update test mocks

**File:** `test/setup.ts`

Update i18next mock initialization if the mock API changed.

### 5. Also consider removing url-polyfill

**File:** `supabase/database.ts` (line 1)
```typescript
import "react-native-url-polyfill/auto"
```

If RN 0.83 (from Spec 08) includes native URL support, this import and the `react-native-url-polyfill` package can be removed entirely. Test by:
1. Removing the import
2. Running the app
3. Testing Supabase auth flow and data fetching

If anything breaks, keep the polyfill and upgrade it: `yarn add react-native-url-polyfill@^3`

---

## Verification

- [ ] `yarn compile` — no type errors at each major version step
- [ ] `yarn test` — all tests pass at each step
- [ ] Manual: Every screen renders translations (not raw keys)
- [ ] Manual: Screens that use `tx` prop on `Text` components show correct text
- [ ] Manual: If the app supports language switching, test each language

---

## Risks

- **Plural handling:** i18next major versions often change plural suffix conventions. If the app uses plurals, they may break silently (showing wrong plural form).
- **Type inference:** react-i18next TypeScript support changes between versions. May surface new type errors.
- **Initialization timing:** If the init API changes, translations may not be available when components first render, showing raw keys briefly.
