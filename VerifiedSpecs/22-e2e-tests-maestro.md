# Spec 22: E2E Tests (Maestro) + CI Coverage Config

**Phase:** 7.5 + 7.6 (Testing Foundation)
**Priority:** Medium
**Effort:** 3-4 hours
**Dependencies:** All Phase 6 work
**Blocked by:** Phase 6 completion

---

## Objective

1. Create Maestro E2E test flows for the core user journeys
2. Configure CI coverage enforcement in Jest

---

## Part A: Maestro E2E Flows

### Existing Setup

- `.maestro/` directory exists
- `_OnFlowStart.yaml` shared setup exists
- No actual test flows have been created

### Flows to Create

#### Flow 1: Login -> View Games

**File:** `.maestro/flows/01-login-view-games.yaml`

```yaml
appId: com.codewordapp
---
- runFlow: ../_OnFlowStart.yaml

# Login
- tapOn: "Email"
- inputText: "${TEST_EMAIL}"
- tapOn: "Password"
- inputText: "${TEST_PASSWORD}"
- tapOn: "Log In"

# Verify games screen
- assertVisible: "Your Games"

# Verify either games list or empty state
- assertVisible:
    anyOf:
      - "No games yet"
      - id: "game-item-.*"
```

#### Flow 2: Create Game

**File:** `.maestro/flows/02-create-game.yaml`

```yaml
appId: com.codewordapp
---
- runFlow: ../_OnFlowStart.yaml
- runFlow: 01-login-view-games.yaml

# Open create modal
- tapOn: "Create Game"

# Fill form
- tapOn: "Name"
- inputText: "E2E Test Game"
- tapOn: "Description"
- inputText: "Created by Maestro E2E test"

# Submit
- tapOn:
    text: "Create"
    index: 1  # The Create button, not the heading

# Verify game appears in list
- assertVisible: "E2E Test Game"
```

#### Flow 3: Join Game

**File:** `.maestro/flows/03-join-game.yaml`

```yaml
appId: com.codewordapp
---
- runFlow: ../_OnFlowStart.yaml
- runFlow: 01-login-view-games.yaml

# Open join modal
- tapOn: "Enter Game Code"

# Enter code
- tapOn: "Game Code"
- inputText: "${TEST_JOIN_CODE}"

# Submit
- tapOn:
    text: "Join"
    index: 1

# Verify result (either success or error)
- assertVisible:
    anyOf:
      - "Your Games"  # Redirected back with new game
      - "Game not found"  # Expected if test code doesn't exist
```

#### Flow 4: Sign Out

**File:** `.maestro/flows/04-sign-out.yaml`

```yaml
appId: com.codewordapp
---
- runFlow: ../_OnFlowStart.yaml
- runFlow: 01-login-view-games.yaml

# Navigate to profile tab
- tapOn: "Profile"

# Sign out
- tapOn: "Sign Out"

# Verify redirected to auth screen
- assertVisible: "Log In"
```

### Test Data Requirements

Maestro flows need test credentials. Create a `.maestro/config.yaml`:

```yaml
env:
  TEST_EMAIL: "e2e-test@codewordapp.test"
  TEST_PASSWORD: "TestPassword123!"
  TEST_JOIN_CODE: "TESTCD"
```

These should be real credentials for a test user in the Supabase dev environment.

### Add testID Props to Key Components

For reliable element targeting, add `testID` props to key elements:

| Component | Element | testID |
|-----------|---------|--------|
| `GamesScreen` | Game list items | `game-item-{id}` |
| `GamesScreen` | "Create Game" button | `create-game-button` |
| `GamesScreen` | "Enter Game Code" button | `join-game-button` |
| Login screen | Email field | `login-email` |
| Login screen | Password field | `login-password` |
| Login screen | Submit button | `login-submit` |

---

## Part B: CI Coverage Configuration

### Update Jest Config

**File:** `jest.config.js`

After Spec 02 adds `collectCoverageFrom`, add threshold enforcement:

```javascript
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/index.ts",
  ],
  coverageThresholds: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
    // Higher thresholds for critical paths
    "src/stores/authStore.ts": {
      branches: 70,
      functions: 80,
      lines: 80,
    },
    "src/lib/db/": {
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
}
```

**Note:** Start with low global thresholds (30%) since coverage is currently near 0% for most files. Ratchet up as more tests are added.

### Include test/ in TypeScript

**File:** `tsconfig.json`

The `test/` directory is currently excluded. Create or update `test/tsconfig.json`:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["jest"]
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Ensure the root `tsconfig.json` references this for type checking:
```json
{
  "references": [{ "path": "./test" }]
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `.maestro/flows/01-login-view-games.yaml` | **New** |
| `.maestro/flows/02-create-game.yaml` | **New** |
| `.maestro/flows/03-join-game.yaml` | **New** |
| `.maestro/flows/04-sign-out.yaml` | **New** |
| `.maestro/config.yaml` | **New** — test environment config |
| `jest.config.js` | Add coverage thresholds |
| `test/tsconfig.json` | Verify/update TypeScript inclusion |
| Various components | Add `testID` props for E2E targeting |

---

## Acceptance Criteria

- [ ] At least 3 Maestro flows exist and are syntactically valid
- [ ] Maestro flows can be run against a dev build with test credentials
- [ ] `jest.config.js` has `coverageThresholds` configured
- [ ] `yarn test --coverage` reports thresholds and passes
- [ ] `test/` directory is included in TypeScript checking
- [ ] Key UI elements have `testID` props

---

## Risks

- **Test data management:** E2E tests need a real test user in Supabase. This must be created and maintained separately from production data.
- **Maestro + BottomSheet:** Maestro may have difficulty interacting with `@gorhom/bottom-sheet` modals. May need to add accessibility labels or use `tapOn` with coordinates as a fallback.
- **Flaky E2E:** Network-dependent tests are inherently flaky. Consider running against a local Supabase instance for reliability.
