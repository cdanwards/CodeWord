# Spec 14: Split Database God Object

**Phase:** 6.1 (Architecture Refactoring)
**Priority:** High — flagged by all 4 evaluators
**Effort:** 3-5 hours
**Dependencies:** Specs 04, 06, 07 (which modify database.ts)
**Blocked by:** Phase 5 completion

---

## Objective

Split `src/lib/database.ts` (~557 lines, ~20 functions) into domain-specific modules while maintaining backward compatibility via a re-export barrel.

---

## Current Structure

`src/lib/database.ts` contains ALL database operations in a single `db` object:

| Domain | Functions | Lines |
|--------|-----------|-------|
| **Profiles** | `getUserProfile`, `createUserProfile`, `updateUserProfile`, `ensureUserProfile` | ~35-93, 532-555 |
| **Games** | `getAllGames`, `getGame`, `createGame`, `createGameHost`, `findGameByCode` | ~96-254 |
| **User Games** | `getUserGames`, `getGameMembers`, `createUserGame`, `joinGameByCode`, `updateUserGame`, `deleteUserGame` | ~257-510 |
| **Words** | `listGameWords`, `addGameWord` | ~365-397 |
| **Assignments** | `listAssignments`, `createAssignment` | ~400-435 |
| **Eliminations** | `listEliminations`, `recordElimination` | ~438-473 |
| **Utility** | `getCurrentUserId`, `withTimeout` (module-level) | ~20-31, 513-529 |

---

## Target Structure

```
src/lib/db/
  index.ts              # Re-exports unified `db` object for backward compat
  types.ts              # Shared types (Result<T>, etc.)
  utils.ts              # withTimeout, getCurrentUserId
  profiles.ts           # Profile CRUD
  games.ts              # Game CRUD + createGameHost
  user-games.ts         # Membership operations + joinGameByCode
  words.ts              # Game word operations
  assignments.ts        # Assignment operations
  eliminations.ts       # Elimination operations
```

---

## Migration Strategy

### 1. Create the `src/lib/db/` directory

### 2. Extract `utils.ts`

Move `withTimeout` and `getCurrentUserId` (shared by multiple modules):

```typescript
// src/lib/db/utils.ts
import { supabase } from "../../../supabase/database"

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  // ... existing implementation
}

export async function getCurrentUserId(): Promise<string | null> {
  // ... existing implementation
}
```

### 3. Extract each domain module

Each module follows the same pattern:

```typescript
// src/lib/db/profiles.ts
import { supabase } from "../../../supabase/database"
import type { UserProfile, NewUserProfile } from "../../../supabase/schema"

export const profilesDb = {
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    // ... move existing implementation
  },
  createUserProfile: async (profile: NewUserProfile): Promise<UserProfile | null> => {
    // ... move existing implementation
  },
  // etc.
}
```

### 4. Create barrel `index.ts`

```typescript
// src/lib/db/index.ts
import { profilesDb } from "./profiles"
import { gamesDb } from "./games"
import { userGamesDb } from "./user-games"
import { wordsDb } from "./words"
import { assignmentsDb } from "./assignments"
import { eliminationsDb } from "./eliminations"
import { getCurrentUserId } from "./utils"

// Unified db object for backward compatibility
// Existing imports of `db` from `@/lib/database` continue to work
export const db = {
  ...profilesDb,
  ...gamesDb,
  ...userGamesDb,
  ...wordsDb,
  ...assignmentsDb,
  ...eliminationsDb,
  getCurrentUserId,
}
```

### 5. Update the old `database.ts` to re-export

```typescript
// src/lib/database.ts
// Re-export for backward compatibility — all consumers can continue
// importing from "@/lib/database" without changes
export { db } from "./db"
```

### 6. Update internal cross-references

`createGameHost` in `games.ts` calls `db.getCurrentUserId()` and `db.findGameByCode()`. After splitting:
- Import `getCurrentUserId` from `./utils`
- `findGameByCode` stays in `games.ts` (same module)

`joinGameByCode` in `user-games.ts` calls `db.findGameByCode()`. After splitting:
- Import `gamesDb` from `./games` or import `findGameByCode` directly

`ensureUserProfile` calls `db.getUserProfile()` and `db.createUserProfile()`. These are all in `profiles.ts`, so no cross-module issue.

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/db/index.ts` | **New** — barrel re-export |
| `src/lib/db/types.ts` | **New** — shared types |
| `src/lib/db/utils.ts` | **New** — withTimeout, getCurrentUserId |
| `src/lib/db/profiles.ts` | **New** — profile operations |
| `src/lib/db/games.ts` | **New** — game operations |
| `src/lib/db/user-games.ts` | **New** — user-game operations |
| `src/lib/db/words.ts` | **New** — word operations |
| `src/lib/db/assignments.ts` | **New** — assignment operations |
| `src/lib/db/eliminations.ts` | **New** — elimination operations |
| `src/lib/database.ts` | Gutted — re-exports from `./db` |

**No consumer changes needed** — all imports of `db` from `@/lib/database` continue to work.

---

## Acceptance Criteria

- [ ] `src/lib/database.ts` is a thin re-export (< 5 lines)
- [ ] Each domain module is < 100 lines
- [ ] No circular imports between modules
- [ ] All existing imports of `db` from `@/lib/database` work unchanged
- [ ] `yarn compile` passes
- [ ] `yarn test` passes
- [ ] Manual: All game flows work (create, join, view, list members)

---

## Risks

- **Circular imports:** `joinGameByCode` (user-games) depends on `findGameByCode` (games). Must import from the module directly, not through the barrel.
- **Import path depth:** Supabase client import path changes from `../../supabase/database` to `../../../supabase/database` — use path alias `@/` if configured.
