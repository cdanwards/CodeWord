# Spec 15: Typed Error Returns (Replace Silent Null Pattern)

**Phase:** 6.2 (Architecture Refactoring)
**Priority:** High — silent error swallowing flagged as critical
**Effort:** 4-6 hours
**Dependencies:** Spec 14 (split database module)
**Blocked by:** Spec 14 completion

---

## Objective

Replace the `catch -> return null/[]` pattern across all database functions with typed `Result<T>` returns. This lets the UI distinguish "no data" from "failed to load" and surface meaningful error messages.

---

## Current Pattern (every function in database.ts)

```typescript
getUserProfile: async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()
    if (error) {
      console.error("Error fetching user profile:", error)
      return null   // <-- caller can't tell: does the profile not exist, or did the query fail?
    }
    return data
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null     // <-- same problem
  }
}
```

**Impact:** The UI shows "No games yet" when the database is unreachable. The user thinks they have no games. In reality, the fetch failed.

---

## Target Pattern

### 1. Define the Result type

**File:** `src/lib/db/types.ts`

```typescript
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export function ok<T>(data: T): Result<T> {
  return { data, error: null }
}

export function err<T>(error: string): Result<T> {
  return { data: null, error }
}
```

### 2. Convert each database function

**Before:**
```typescript
getUserProfile: async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()
    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
    return data
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null
  }
}
```

**After:**
```typescript
getUserProfile: async (userId: string): Promise<Result<UserProfile | null>> => {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()
    if (error) {
      // PGRST116 = "no rows found" — this is NOT an error, it's legitimate empty state
      if (error.code === "PGRST116") return ok(null)
      return err(`Failed to fetch profile: ${error.message}`)
    }
    return ok(data)
  } catch (error) {
    return err(`Failed to fetch profile: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
```

### 3. Convert list functions

**Before:**
```typescript
getUserGames: async (userId: string): Promise<UserGame[]> => {
  // ... catch -> return []
}
```

**After:**
```typescript
getUserGames: async (userId: string): Promise<Result<UserGame[]>> => {
  try {
    const { data, error } = await /* ... */
    if (error) return err(`Failed to load games: ${error.message}`)
    return ok(data || [])
  } catch (error) {
    return err(`Failed to load games: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
```

### 4. Update all call sites

Each consumer must be updated to handle the Result type. Example:

**File:** `src/screens/GamesScreen.tsx`

```typescript
// Before:
const userGames = await db.getUserGames(userId)
setGames(userGames as UserGameWithGame[])

// After:
const result = await db.getUserGames(userId)
if (result.error) {
  // Show error to user instead of empty state
  setError(result.error)
  return
}
setGames(result.data as UserGameWithGame[])
```

**File:** `src/components/JoinGameModal.tsx`

```typescript
// Before:
const game = await db.findGameByCode(trimmedCode)
if (!game) {
  setError("Game not found. Please check the code and try again.")
  return
}

// After:
const result = await db.findGameByCode(trimmedCode)
if (result.error) {
  setError(result.error)
  return
}
if (!result.data) {
  setError("Game not found. Please check the code and try again.")
  return
}
const game = result.data
```

---

## Functions to Convert (all in split modules from Spec 14)

| Module | Functions |
|--------|-----------|
| `profiles.ts` | `getUserProfile`, `createUserProfile`, `updateUserProfile`, `ensureUserProfile` |
| `games.ts` | `getAllGames`, `getGame`, `createGame`, `createGameHost`, `findGameByCode` |
| `user-games.ts` | `getUserGames`, `getGameMembers`, `createUserGame`, `joinGameByCode`, `updateUserGame`, `deleteUserGame` |
| `words.ts` | `listGameWords`, `addGameWord` |
| `assignments.ts` | `listAssignments`, `createAssignment` |
| `eliminations.ts` | `listEliminations`, `recordElimination` |
| `utils.ts` | `getCurrentUserId` |

---

## Call Sites to Update

| File | Functions Called |
|------|----------------|
| `src/screens/GamesScreen.tsx` | `getUserGames` |
| `src/app/(app)/game/[id].tsx` | `getGame`, `getGameMembers`, `listGameWords` |
| `src/components/JoinGameModal.tsx` | `getCurrentUserId`, `findGameByCode`, `getUserGames`, `joinGameByCode` |
| `src/components/CreateGameModal.tsx` | `getCurrentUserId`, `createGameHost` |
| `src/components/AuthProvider.tsx` | `ensureUserProfile` |
| `src/stores/authStore.ts` | None (doesn't use db directly) |

---

## Acceptance Criteria

- [ ] `Result<T>` type defined in `src/lib/db/types.ts`
- [ ] Every `db.*` function returns `Result<T>` instead of `T | null` or `T[]`
- [ ] No `catch -> return null` or `catch -> return []` patterns remain
- [ ] All call sites handle `result.error` and show user-facing error messages
- [ ] "No games" / "No members" empty states only show when `result.data` is genuinely empty
- [ ] Error states show meaningful messages (not just "Something went wrong")
- [ ] `yarn compile` passes
- [ ] `yarn test` passes

---

## Risks

- **Large blast radius:** Every screen and component that calls `db.*` must be updated. Do this methodically, one module at a time.
- **Breaking the withDatabaseFallback wrapper:** `getUserGames` is wrapped in `withDatabaseFallback` from `network-utils.ts`. This wrapper expects a specific return type — update it to work with `Result<T>`.
