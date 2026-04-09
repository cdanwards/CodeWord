# Spec 13: Conditional Toolchain Upgrades (TypeScript 6 + Jest 30)

**Phase:** 5b + 5c (Toolchain Upgrades)
**Priority:** Medium
**Effort:** 0.5-1 day each (if supported)
**Dependencies:** Spec 08 (Expo SDK 55)
**Blocked by:** Phase 3 completion

---

## Objective

Upgrade TypeScript and Jest to their latest major versions, but ONLY if the Expo ecosystem supports them. Both are gated on compatibility checks.

---

## Part A: TypeScript 5.8 -> 6.x

### Gate Check (must pass before proceeding)

1. Check if `expo/tsconfig.base` (extended by this project's `tsconfig.json`) supports TS 6
2. Check Expo SDK 55 release notes for TS version requirements
3. Run `npx expo doctor` and check for TS version warnings

**If the gate fails:** Skip this upgrade entirely. Note in the PR that TS 6 is deferred until Expo officially supports it.

### If Gate Passes

#### Upgrade steps:
```bash
yarn add -D typescript@^6
```

#### Files to check:
| File | Check |
|------|-------|
| `tsconfig.json` | Deprecated options (TS 6 may remove some `compilerOptions`) |
| `test/test-tsconfig.json` | Same |
| `drizzle.config.ts` | Drizzle ORM TS 6 compatibility |

#### Verification:
- [ ] `yarn compile` — zero errors
- [ ] `yarn test` — all tests pass
- [ ] `npx expo start` — dev server works

---

## Part B: Jest 29 -> 30

### Gate Check (must pass before proceeding)

1. Check `jest-expo@~55` peer dependency: `yarn info jest-expo peerDependencies`
2. If `jest-expo` requires Jest 29, this upgrade must wait

**If the gate fails:** Skip this upgrade entirely. Note in the PR that Jest 30 is deferred until jest-expo supports it.

### If Gate Passes

#### Upgrade steps:
```bash
yarn add -D jest@^30 babel-jest@^30 @types/jest@^30
```

#### Files to update:
| File | Change |
|------|--------|
| `jest.config.js` | Check for deprecated config options in Jest 30 |
| `test/setup.ts` | Check if mock APIs changed |

#### Verification:
- [ ] `yarn test` — all tests pass
- [ ] `npx jest --coverage` — coverage reporting works

---

## Acceptance Criteria

- [ ] Gate checks documented in commit message (what was checked, pass/fail)
- [ ] If gate passed: package upgraded and all checks green
- [ ] If gate failed: upgrade skipped with clear documentation of why
- [ ] No forced upgrades that break Expo compatibility

---

## Risks

- **TS 6 type inference changes:** May surface new type errors across the codebase. Usually fixable but can be time-consuming.
- **Jest 30 test runner changes:** May affect how `jest-expo` transforms code. Could cause cryptic test failures.
