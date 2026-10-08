# Spec 05: Auth Mapping Consolidation & Token Storage Cleanup

**Phase:** 2 (Critical Fixes)
**Priority:** Critical — security + code duplication
**Effort:** 2-3 hours
**Dependencies:** Spec 01 (dead code removal)
**Blocked by:** Phase 1 completion

---

## Objective

1. Extract a `mapSupabaseUser()` helper to replace the 4x duplicated user-transform logic
2. Fix hardcoded `emailVerified: true` — derive from actual Supabase user state
3. Remove `session` from Zustand persistence to eliminate duplicate token storage

---

## Problem 1: Duplicated User Transform (4 locations)

The same Supabase-user-to-app-User transform exists in:

| Location | Lines |
|----------|-------|
| `src/stores/authStore.ts` → `signIn` | 103-111 |
| `src/stores/authStore.ts` → `signUp` | 149-157 |
| `src/stores/authStore.ts` → `refreshSession` | 214-222 |
| `src/components/AuthProvider.tsx` → `onAuthStateChange` | 26-34 |

Each hardcodes `emailVerified: true` with the comment `// Email confirmation disabled for now`.

---

## Problem 2: Hardcoded `emailVerified: true`

If Supabase email confirmation is enabled in any environment, the client will report all users as verified. The Supabase user object provides `email_confirmed_at` which should be used instead.

---

## Problem 3: Duplicate Session Token Storage

**File:** `src/stores/authStore.ts` (lines 249-255)
```typescript
partialize: (state) => ({
  user: state.user,
  session: state.session,        // <-- access tokens in MMKV
  isAuthenticated: state.isAuthenticated,
}),
```

Supabase already persists sessions via `expo-secure-store` (configured in `supabase/database.ts:42-47`). Persisting `session` in MMKV creates a duplicate that can become stale.

---

## Required Changes

### 1. Create `mapSupabaseUser` helper

**New file:** `src/lib/auth-utils.ts`

```typescript
import type { User } from "@/stores/authStore"

interface SupabaseUserLike {
  id: string
  email?: string | null
  email_confirmed_at?: string | null
  user_metadata?: Record<string, any>
  created_at: string
  updated_at?: string | null
}

/**
 * Transform a Supabase auth user object into the app's User interface.
 * Single source of truth for this mapping — used by authStore and AuthProvider.
 */
export function mapSupabaseUser(supabaseUser: SupabaseUserLike): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name:
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split("@")[0] ||
      "",
    image: supabaseUser.user_metadata?.avatar_url || null,
    emailVerified: !!supabaseUser.email_confirmed_at,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
  }
}
```

### 2. Update `authStore.ts` — replace all 3 transforms

**File:** `src/stores/authStore.ts`

Replace each inline transform block with `mapSupabaseUser(data.user)`.

**In `signIn` (lines 103-111):**
```typescript
// Before:
const user: User = {
  id: data.user.id,
  email: data.user.email || "",
  // ... 7 more lines
}

// After:
import { mapSupabaseUser } from "@/lib/auth-utils"
const user = mapSupabaseUser(data.user)
```

**In `signUp` (lines 149-157):** Same replacement. Note: the current code uses `name.trim()` from the signup form as a fallback. The `mapSupabaseUser` helper handles this via `user_metadata.name` — verify this is populated by the signup call at line 136-139 which passes `data: { name: name.trim() }`.

**In `refreshSession` (lines 214-222):** Replace with `mapSupabaseUser(session.user)`.

### 3. Update `AuthProvider.tsx` — replace transform

**File:** `src/components/AuthProvider.tsx` (lines 26-34)

```typescript
// Before:
const user = {
  id: session.user.id,
  email: session.user.email || "",
  // ... 7 more lines
}

// After:
import { mapSupabaseUser } from "@/lib/auth-utils"
const user = mapSupabaseUser(session.user)
```

### 4. Remove `session` from Zustand persistence

**File:** `src/stores/authStore.ts` (lines 249-255)

```typescript
// Before:
partialize: (state) => ({
  user: state.user,
  session: state.session,
  isAuthenticated: state.isAuthenticated,
}),

// After:
partialize: (state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
}),
```

The `session` state still exists in the store for in-memory use during the app lifecycle — it's just no longer persisted to disk. On app restart, `refreshSession()` (called by `checkAuth()` in `AuthProvider`) will fetch the session from Supabase's Secure Store.

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/auth-utils.ts` | **New** — `mapSupabaseUser()` helper |
| `src/stores/authStore.ts` | Replace 3 inline transforms; remove `session` from `partialize` |
| `src/components/AuthProvider.tsx` | Replace 1 inline transform |

---

## Acceptance Criteria

- [ ] `mapSupabaseUser()` exists in `src/lib/auth-utils.ts`
- [ ] `emailVerified` is derived from `!!user.email_confirmed_at` (not hardcoded)
- [ ] Zero instances of `emailVerified: true` remain in the codebase
- [ ] All 4 user-transform locations use `mapSupabaseUser()`
- [ ] `session` is NOT in the `partialize` config (not persisted to MMKV)
- [ ] Auth flow works: sign in -> user populated -> kill app -> reopen -> session restored from Supabase
- [ ] `yarn compile` passes
- [ ] `yarn test` passes

---

## Risks

- **Sign-up name fallback:** The current `signUp` transform uses the `name` param directly. With `mapSupabaseUser`, the name comes from `user_metadata.name`. Verify that the Supabase `signUp` call populates this field via the `data: { name }` option. If not, pass the name as an override.
- **Session restoration timing:** Removing persisted `session` means the app will briefly show a loading state on cold start while `refreshSession()` completes. This is already the behavior since `checkAuth()` is called in `AuthProvider` on mount.
