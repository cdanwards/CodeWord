# Spec 19: Test Suite — Auth Store

**Phase:** 7.1 (Testing Foundation)
**Priority:** High — zero auth test coverage currently
**Effort:** 3-4 hours
**Dependencies:** Spec 05 (auth mapping), Spec 17 (auth consolidation)
**Blocked by:** Phase 6 completion

---

## Objective

Write comprehensive unit tests for `src/stores/authStore.ts` covering all auth flows with a mocked Supabase client. This is the highest-value test suite because auth is the gateway to every other feature.

---

## Test File

**New file:** `src/stores/__tests__/authStore.test.ts`

---

## Mock Setup

The auth store depends on `authClient` from `src/lib/auth-client.ts`, which wraps `supabase.auth.*`. Mock at the `authClient` level:

```typescript
jest.mock("@/lib/auth-client", () => ({
  authClient: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
}))
```

Also mock the storage adapter to prevent MMKV usage in tests:

```typescript
jest.mock("@/stores/storage", () => ({
  zustandStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))
```

---

## Test Cases

### signIn

| Test | Setup | Assert |
|------|-------|--------|
| Successful sign in | Mock `signInWithPassword` -> `{ data: { user: mockUser }, error: null }` | `user` populated, `isAuthenticated: true`, returns `{ success: true }` |
| Sign in with wrong password | Mock -> `{ data: null, error: { message: "Invalid credentials" } }` | `user: null`, `error` set, returns `{ success: false, error: "Invalid credentials" }` |
| Sign in with network error | Mock -> throws | `error` set, returns `{ success: false }` |
| Loading state during sign in | Observe mid-call | `isLoading: true` during call, `false` after |

### signUp

| Test | Setup | Assert |
|------|-------|--------|
| Successful sign up | Mock `signUp` -> `{ data: { user: mockUser }, error: null }` | `user` populated, `isAuthenticated: true`, returns `{ success: true }` |
| Sign up with existing email | Mock -> `{ data: null, error: { message: "User already registered" } }` | `error` set, returns `{ success: false }` |
| Sign up with weak password | Mock -> error | `error` set |
| User name populated from metadata | Mock user with `user_metadata.name` | `user.name` matches |

### signOut

| Test | Setup | Assert |
|------|-------|--------|
| Successful sign out | Mock `signOut` -> success | `user: null`, `session: null`, `isAuthenticated: false` |
| Sign out with error | Mock `signOut` -> throws | `error` set, but user state still cleared (or not — verify current behavior) |

### refreshSession

| Test | Setup | Assert |
|------|-------|--------|
| Active session exists | Mock `getSession` -> valid session | `user` populated, `session` populated |
| No active session | Mock `getSession` -> null session | `user: null`, `session: null` |
| Session expired | Mock `getSession` -> error | `user: null`, `session: null` |

### emailVerified (after Spec 05)

| Test | Setup | Assert |
|------|-------|--------|
| Email confirmed | Mock user with `email_confirmed_at: "2025-01-01"` | `user.emailVerified: true` |
| Email not confirmed | Mock user with `email_confirmed_at: null` | `user.emailVerified: false` |

### mapSupabaseUser (after Spec 05)

| Test | Setup | Assert |
|------|-------|--------|
| Full user data | Complete Supabase user object | All fields mapped correctly |
| Minimal user data | Only required fields | Defaults applied (name from email, null image) |
| Missing email | `email: null` | `email: ""` (empty string fallback) |

---

## Acceptance Criteria

- [ ] Test file exists at `src/stores/__tests__/authStore.test.ts`
- [ ] All test cases above pass
- [ ] Tests use mocked Supabase — no real network calls
- [ ] Tests verify state changes (not just return values)
- [ ] Tests verify loading state transitions
- [ ] Tests verify error state management
- [ ] `yarn test` passes with all new tests
- [ ] Coverage for `authStore.ts` > 80%

---

## Risks

- **Zustand persist middleware:** The persist middleware may interfere with test state. Either mock the storage adapter (shown above) or use `useAuthStore.setState()` directly in tests.
- **Async timing:** Auth actions are async. Use `await` and `act()` from React Testing Library to ensure state updates complete before assertions.
