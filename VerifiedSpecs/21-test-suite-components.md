# Spec 21: Test Suite — Component Tests

**Phase:** 7.4 (Testing Foundation)
**Priority:** Medium
**Effort:** 3-4 hours
**Dependencies:** Specs 14-16 (architecture refactoring)
**Blocked by:** Phase 6 completion

---

## Objective

Write component tests for the core interactive components: `CreateGameModal`, `JoinGameModal`, and auth-gated screen rendering. Use `@testing-library/react-native` (already installed as a dev dependency).

---

## Test Files

```
src/components/__tests__/
  CreateGameModal.test.tsx
  JoinGameModal.test.tsx
  AuthProvider.test.tsx
```

---

## Mock Setup

All component tests need these common mocks:

```typescript
// Mock bottom sheet
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModal: ({ children }: any) => <>{children}</>,
  BottomSheetView: ({ children }: any) => <>{children}</>,
  BottomSheetBackdrop: () => null,
}))

// Mock database
jest.mock("@/lib/database", () => ({
  db: {
    getCurrentUserId: jest.fn(),
    createGameHost: jest.fn(),
    findGameByCode: jest.fn(),
    getUserGames: jest.fn(),
    joinGameByCode: jest.fn(),
    ensureUserProfile: jest.fn(),
  },
}))

// Mock auth store
jest.mock("@/stores", () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    user: { id: "test-user-id", email: "test@test.com" },
    checkAuth: jest.fn(),
    setUser: jest.fn(),
    setSession: jest.fn(),
  })),
}))
```

---

## Test Cases: `CreateGameModal.test.tsx`

### Rendering

| Test | Assert |
|------|--------|
| Renders heading | "Create Game" text visible |
| Renders form fields | Name, Description, Duration fields present |
| Renders action buttons | Cancel and Create buttons visible |
| Create button disabled when name empty | Button has `disabled` prop |

### Form Validation (after Spec 16)

| Test | Action | Assert |
|------|--------|--------|
| Empty name submission | Press Create with empty name | Error message shown |
| Valid submission | Fill name -> press Create | `createGameHost` called with correct args |

### Success Flow

| Test | Setup | Action | Assert |
|------|-------|--------|--------|
| Game created successfully | Mock `createGameHost` -> game | Fill form -> submit | `onCreated` callback called with game id |
| Form resets after success | Mock success | Submit -> reopen | Fields are empty |

### Error Flow

| Test | Setup | Action | Assert |
|------|-------|--------|--------|
| Creation fails | Mock `createGameHost` -> null | Submit | Error message shown |
| Not authenticated | Mock `getCurrentUserId` -> null | Submit | "Please sign in" error |

---

## Test Cases: `JoinGameModal.test.tsx`

### Rendering

| Test | Assert |
|------|--------|
| Renders heading | "Join Game" text visible |
| Renders code input | TextField with "Game Code" label |
| Renders action buttons | Cancel and Join buttons |
| Join disabled when code empty | Button disabled |

### Join Flow

| Test | Setup | Action | Assert |
|------|-------|--------|--------|
| Successful join | Mock findGameByCode -> game, joinGameByCode -> userGame | Enter code -> submit | `onJoined` callback called |
| Game not found | Mock findGameByCode -> null | Enter code -> submit | "Game not found" error |
| Already in game | Mock getUserGames -> includes this game | Enter code -> submit | "already in this game" error |
| Join fails | Mock joinGameByCode -> null | Enter code -> submit | "Failed to join" error |

### Input Handling

| Test | Action | Assert |
|------|--------|--------|
| Uppercases input | Type "abc123" | Input value is "ABC123" |
| Limits to 6 chars | Type "ABCDEFGH" | Input value is "ABCDEF" |

---

## Test Cases: `AuthProvider.test.tsx`

### Auth State Management

| Test | Setup | Assert |
|------|-------|--------|
| Calls checkAuth on mount | Render AuthProvider | `checkAuth` was called |
| Renders children | Render with child content | Child content visible |

### Auth State Changes

| Test | Setup | Assert |
|------|-------|--------|
| SIGNED_IN event | Trigger onAuthStateChange with SIGNED_IN + user | `setUser` called with mapped user |
| SIGNED_OUT event | Trigger onAuthStateChange with SIGNED_OUT | `setUser(null)` called |
| Cleans up subscription | Unmount | `unsubscribe` called |

---

## Acceptance Criteria

- [ ] All test files exist
- [ ] All test cases pass
- [ ] Tests use mocked dependencies — no real Supabase calls
- [ ] Tests verify user interactions (press, type) not just rendering
- [ ] Tests verify error states are shown to the user
- [ ] Tests verify success callbacks are called
- [ ] `yarn test` passes
- [ ] Coverage for tested components > 70%

---

## Risks

- **BottomSheet mocking:** `@gorhom/bottom-sheet` uses Reanimated internally. The mock must replace the entire module to avoid Reanimated-in-test issues.
- **Navigation mocking:** If components use `useRouter()`, mock `expo-router`:
  ```typescript
  jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }))
  ```
