# Spec 02: Fix Test Infrastructure Baseline

**Phase:** 1 (Pre-Flight)
**Priority:** Critical — accurate coverage reporting needed before all other work
**Effort:** < 1 hour
**Dependencies:** None
**Blocked by:** Nothing

---

## Objective

Fix two test infrastructure issues that produce misleading results: a vacuously-passing i18n test and a Jest config that hides actual coverage gaps.

---

## Task 1: Fix i18n Test Path

**File:** `test/i18n.test.ts` (line 58)

**Current code:**
```typescript
const command = `grep "[T\\|t]x=[{]\\?\\"\\S*\\"[}]\\?\\|translate(\\"\\S*\\"" -ohr './app' | grep -o "\\".*\\""`
```

**Problem:** The app source files live in `./src/app`, not `./app`. The grep finds nothing, so `allTranslationsUsed` is empty, the `for` loop runs zero iterations, and the test always passes regardless of missing translations.

**Fix:** Change `'./app'` to `'./src/app'`:
```typescript
const command = `grep "[T\\|t]x=[{]\\?\\"\\S*\\"[}]\\?\\|translate(\\"\\S*\\"" -ohr './src/app' | grep -o "\\".*\\""`
```

**Note:** After fixing, this test may now fail if there are translation keys used in screens that aren't in the `en` translation file. If it does, either add the missing translations or add them to the `EXCEPTIONS` array with a comment explaining why.

---

## Task 2: Add `collectCoverageFrom` to Jest Config

**File:** `jest.config.js`

**Current config:**
```javascript
/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/setup.ts"],
}
```

**Problem:** Without `collectCoverageFrom`, Jest only reports coverage for files that are imported by existing tests. The reported 88.57% coverage is meaningless — it only measures coverage of the 4 trivial files the tests happen to touch, not the actual codebase.

**Fix:** Add `collectCoverageFrom`:
```javascript
/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/index.ts",
  ],
}
```

---

## Acceptance Criteria

- [ ] `test/i18n.test.ts` grep command targets `./src/app` instead of `./app`
- [ ] `jest.config.js` includes `collectCoverageFrom` covering all `src/**/*.{ts,tsx}`
- [ ] `yarn test` passes (fix any i18n test failures caused by the path correction)
- [ ] `npx jest --coverage` now reports coverage against all source files, not just test-touched files
- [ ] Coverage percentage will drop significantly (this is expected and correct — it now reflects reality)

---

## Risks

- The i18n test may fail after the path fix if translation keys are missing. This is a real bug being surfaced, not a test problem — fix the translations or add to exceptions.
