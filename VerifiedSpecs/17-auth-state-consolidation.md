# Spec 17: Auth State Consolidation

**Phase:** 6.4 (Architecture Refactoring)
**Priority:** Medium
**Effort:** 2-3 hours
**Dependencies:** Spec 05 (auth mapping consolidation)
**Blocked by:** Phase 5 completion

---

## Objective

1. Replace broad `useAuth()` usage with granular Zustand selectors to reduce unnecessary re-renders
2. Properly type the Supabase storage adapter (remove `as any`)
3. Ensure a single source of truth for auth state

---

## Problem 1: `useAuth()` Triggers Full Re-renders

**File:** `src/stores/hooks.ts` (lines 5-37)

```typescript
export const useAuth = () => {
  const {
    user, session, isLoading, isAuthenticated, error,
    setUser, setSession, signIn, signUp, signOut, refreshSession, checkAuth, clearError,
  } = useAuthStore()
  return { /* everything */ }
}
```

This hook returns the entire store. Any change to any auth state property causes ALL consumers to re-render. Granular hooks already exist but aren't used:

| Hook | Purpose | Currently Used? |
|------|---------|----------------|
| `useUser()` | Just the user object | Defined but unused |
| `useIsAuthenticated()` | Just the boolean | Defined but unused |
| `useIsLoading()` | Just loading state | Defined but unused |
| `useAuthError()` | Just error string | Defined but unused |
| `useAuthActions()` | Just action functions | Defined but unused |

**Files using `useAuth()` that should use granular hooks:**

| File | What it Actually Needs |
|------|----------------------|
| `src/screens/GamesScreen.tsx` | `isAuthenticated`, `user?.id` -> use `useUser()` + `useIsAuthenticated()` |
| `src/screens/HomeScreen.tsx` | Check what's used — likely `user` only |
| `src/app/(app)/_layout.tsx` (AppLayout) | Likely `isAuthenticated` only |
| `src/app/(auth)/_layout.tsx` (AuthLayout) | Likely `isAuthenticated` only |
| `src/components/AuthProvider.tsx` | `checkAuth`, `setUser`, `setSession` -> use `useAuthActions()` + specific setters |

---

## Problem 2: `as any` on Supabase Storage Adapter

**File:** `supabase/database.ts` (line 43)

```typescript
auth: {
  storage: ExpoSecureStoreAdapter as any,
  // ...
}
```

**Fix:** Type the adapter properly:

```typescript
import type { SupportedStorage } from "@supabase/supabase-js"

const ExpoSecureStoreAdapter: SupportedStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,  // no more `as any`
    // ...
  },
})
```

**Note:** Check if `SupportedStorage` is the correct type name in the installed `@supabase/supabase-js` version. It might be `StorageAdapter` or `CustomStorageAdapter`.

---

## Required Changes

### 1. Update all screens to use granular hooks

Replace `useAuth()` with the specific hooks that match what the component actually needs.

### 2. Type the Supabase storage adapter

Remove `as any`, use proper type from `@supabase/supabase-js`.

### 3. Consider deprecating `useAuth()`

Add a comment or rename to `useAuthFull()` to discourage use. Or simply keep it for cases where multiple pieces of state are genuinely needed.

---

## Files Changed

| File | Change |
|------|--------|
| `src/screens/GamesScreen.tsx` | Replace `useAuth()` with granular hooks |
| `src/screens/HomeScreen.tsx` | Replace `useAuth()` with granular hooks |
| `src/app/(app)/_layout.tsx` | Replace `useAuth()` with granular hooks |
| `src/app/(auth)/_layout.tsx` | Replace `useAuth()` with granular hooks |
| `src/components/AuthProvider.tsx` | Replace `useAuth()` with `useAuthActions()` + specific setters |
| `supabase/database.ts` | Type `ExpoSecureStoreAdapter` properly, remove `as any` |

---

## Acceptance Criteria

- [ ] No screen uses `useAuth()` when a granular hook would suffice
- [ ] `as any` removed from Supabase storage adapter
- [ ] `ExpoSecureStoreAdapter` typed with `SupportedStorage` (or equivalent)
- [ ] No observable behavior changes (same auth flows, same navigation)
- [ ] `yarn compile` passes
- [ ] `yarn test` passes

---

## Risks

- **Zustand selector equality:** Granular hooks use `useAuthStore((state) => state.X)`. Zustand uses `Object.is` for equality by default. If any selected value is an object (like `user`), it will re-render on every store update unless the reference is stable. This is already the case with `useUser()` — it should work correctly.
