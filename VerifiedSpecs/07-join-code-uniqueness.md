# Spec 07: Join Code Uniqueness & Data Integrity

**Phase:** 2 (Critical Fixes)
**Priority:** High — race condition flagged by all 4 evaluators
**Effort:** 2-3 hours
**Dependencies:** Spec 04 (RLS policy — if adding migration, coordinate ordering)
**Blocked by:** Phase 1 completion

---

## Objective

Ensure game join codes are atomically unique by adding a database constraint and improving the application-level code generation to handle collisions gracefully. Also add CHECK constraints for status columns.

---

## Problem 1: Non-Atomic Join Code Uniqueness

**File:** `src/lib/database.ts` (lines 169-191)

**Current code:**
```typescript
let code = generateCode(6)
for (let attempts = 0; attempts < 5; attempts += 1) {
  const { data: existing, error: existErr } = await supabase
    .from("games")
    .select("id")
    .eq("code", code)
    .maybeSingle()
  if (existErr) {
    console.warn("Error checking code uniqueness (continuing):", existErr.message)
    break   // <-- breaks out on error, uses potentially non-unique code
  }
  if (!existing) break
  code = generateCode(6)
}
```

**Issues:**
1. Check-then-insert is not atomic — two concurrent users can get the same code
2. On check error, it breaks and uses the unchecked code
3. If all 5 attempts find collisions, it still uses the last generated code
4. No retry on insert failure from unique constraint violation

---

## Problem 2: Free-Text Status Columns

**Files:** `supabase/schema.ts:39`, `supabase/schema.ts:57`

Both `games.status` and `user_games.status` are `text()` columns with `.default("lobby")` / `.default("active")` but no CHECK constraint — any string can be inserted.

---

## Required Changes

### 1. Database migration for constraints

**New file:** `supabase/migrations/005_data_integrity.sql`

```sql
-- Add UNIQUE constraint on games.code (if not already present)
-- This is the database-level guarantee that prevents duplicate codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'games_code_unique'
  ) THEN
    ALTER TABLE games ADD CONSTRAINT games_code_unique UNIQUE (code);
  END IF;
END $$;

-- Add CHECK constraints for status columns
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check
  CHECK (status IN ('lobby', 'pending', 'active', 'completed', 'cancelled'));

ALTER TABLE user_games DROP CONSTRAINT IF EXISTS user_games_status_check;
ALTER TABLE user_games ADD CONSTRAINT user_games_status_check
  CHECK (status IN ('active', 'eliminated', 'left', 'won'));

ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_status_check;
ALTER TABLE assignments ADD CONSTRAINT assignments_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'failed'));

-- Add indexes for game-scoped queries (missing per evaluation)
CREATE INDEX IF NOT EXISTS idx_assignments_game_id ON assignments(game_id);
CREATE INDEX IF NOT EXISTS idx_eliminations_game_id ON eliminations(game_id);
CREATE INDEX IF NOT EXISTS idx_game_words_game_id ON game_words(game_id);
```

### 2. Add TypeScript union types

**New file:** `src/types/game-status.ts`

```typescript
export type GameStatus = "lobby" | "pending" | "active" | "completed" | "cancelled"
export type UserGameStatus = "active" | "eliminated" | "left" | "won"
export type AssignmentStatus = "pending" | "active" | "completed" | "failed"
```

### 3. Fix createGameHost to handle collision via constraint

**File:** `src/lib/database.ts`

Replace the check-then-insert pattern with an insert-and-retry-on-collision pattern:

```typescript
createGameHost: async (input: {
  name: string
  description?: string
  durationHours?: number
}): Promise<Game | null> => {
  try {
    const userId = await db.getCurrentUserId()
    if (!userId) {
      console.error("No authenticated user to create game")
      return null
    }

    const generateCode = (length = 6) => {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
      let result = ""
      for (let i = 0; i < length; i += 1) {
        result += alphabet[Math.floor(Math.random() * alphabet.length)]
      }
      return result
    }

    const durationHours = input.durationHours ?? 72
    const MAX_ATTEMPTS = 5

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const code = generateCode(6)
      const insertPayload = {
        name: input.name,
        description: input.description ?? null,
        code,
        host_user_id: userId,
        status: "lobby",
        duration_hours: durationHours,
        settings: {},
      }

      const { data: game, error } = await withTimeout<any>(
        supabase.from("games").insert(insertPayload).select().single() as unknown as Promise<any>,
        12000,
        "createGameHost:insertGame",
      )

      if (error) {
        // Check if it's a unique constraint violation on code
        if (error.code === "23505" && error.message?.includes("games_code_unique")) {
          // Code collision — retry with a new code
          continue
        }
        console.error("Error creating host game:", error)
        return null
      }

      // Success — now create the host membership
      const { error: ugErr } = await withTimeout<any>(
        supabase
          .from("user_games")
          .insert({
            user_id: userId,
            game_id: game.id,
            role: "host",
            status: "active",
            is_ready: false,
          })
          .select() as unknown as Promise<any>,
        8000,
        "createGameHost:insertMembership",
      )
      if (ugErr) {
        console.error("Error inserting host membership:", ugErr)
      }

      return game
    }

    // All attempts exhausted (extremely unlikely with 6-char alphanumeric codes)
    console.error("Failed to generate unique game code after", MAX_ATTEMPTS, "attempts")
    return null
  } catch (error) {
    console.error("Error in createGameHost:", error)
    return null
  }
},
```

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/005_data_integrity.sql` | **New** — UNIQUE constraint, CHECK constraints, indexes |
| `src/types/game-status.ts` | **New** — TypeScript union types for statuses |
| `src/lib/database.ts` | Rewrite `createGameHost` code generation to retry on constraint violation |

---

## Acceptance Criteria

- [ ] `UNIQUE` constraint exists on `games.code`
- [ ] CHECK constraints exist on `games.status`, `user_games.status`, `assignments.status`
- [ ] Indexes exist on `assignments.game_id`, `eliminations.game_id`, `game_words.game_id`
- [ ] TypeScript union types defined for all status fields
- [ ] `createGameHost` retries on unique constraint violation (up to 5 attempts)
- [ ] `createGameHost` does NOT use check-then-insert pattern
- [ ] Migration applies cleanly
- [ ] `yarn compile` passes

---

## Risks

- **Existing data:** If any existing game has a status value not in the CHECK constraint list (e.g., something other than lobby/pending/active/completed/cancelled), the migration will fail. Run `SELECT DISTINCT status FROM games` and `SELECT DISTINCT status FROM user_games` before applying.
- **Status value alignment:** The schema uses `"lobby"` as the default for `games.status` but the evaluations mentioned `"pending"` — verify which values are actually in use.
