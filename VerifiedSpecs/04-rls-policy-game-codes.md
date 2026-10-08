# Spec 04: Restrict RLS Policy for Game Join Codes

**Phase:** 2 (Critical Fixes)
**Priority:** Critical — security vulnerability
**Effort:** 2-3 hours
**Dependencies:** Spec 01 (dead code removal)
**Blocked by:** Phase 1 completion

---

## Objective

Replace the global `SELECT` policy on the `games` table so that join codes are not publicly enumerable. Currently, any authenticated user can query all games and read their join codes, bypassing the intended private invite flow.

---

## Current State

**Migration 001** (`supabase/migrations/001_update_for_supabase_auth.sql:72-73`):
```sql
CREATE POLICY "Anyone can view games" ON games
  FOR SELECT USING (true);
```

**Migration 003** (`supabase/migrations/003_games_policies.sql`):
Adds `INSERT`, `UPDATE`, `DELETE` policies scoped to `host_user_id`, but does NOT modify the global `SELECT` policy.

**Result:** Any client with the Supabase anon key can run `SELECT * FROM games` and get every game's join code.

---

## Required Changes

### 1. New migration file

**File:** `supabase/migrations/004_restrict_games_select.sql`

```sql
-- Restrict games SELECT policy to members and hosts only.
-- Previously "Anyone can view games" allowed all authenticated users
-- to enumerate join codes for games they weren't part of.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view games" ON games;

-- Hosts can always see their own games
CREATE POLICY "Hosts can view their games" ON games
  FOR SELECT
  USING (auth.uid() = host_user_id);

-- Members can see games they've joined
CREATE POLICY "Members can view their games" ON games
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_games
      WHERE user_games.game_id = games.id
      AND user_games.user_id = auth.uid()
    )
  );

-- Create a secure RPC for join-code lookup that returns minimal data
-- (only game name and id, not the full row with code)
CREATE OR REPLACE FUNCTION public.lookup_game_by_code(join_code TEXT)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  status TEXT,
  host_user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.description, g.status, g.host_user_id
  FROM games g
  WHERE g.code = join_code;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_game_by_code(TEXT) TO authenticated;
```

### 2. Update Drizzle schema (if needed)

**File:** `supabase/schema.ts`

No schema changes needed — this is a policy/function change only.

### 3. Update app code to use the RPC for join-code lookup

**File:** `src/lib/database.ts`

Update `findGameByCode` to use the new RPC instead of a direct `SELECT`:

```typescript
findGameByCode: async (code: string): Promise<Game | null> => {
  try {
    const { data, error } = await supabase
      .rpc("lookup_game_by_code", { join_code: code })
      .single()

    if (error) {
      console.error("Error finding game by code:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in findGameByCode:", error)
    return null
  }
},
```

### 4. Update JoinGameModal if it relies on full game data from findGameByCode

**File:** `src/components/JoinGameModal.tsx`

The `findGameByCode` call at line 66 is used to:
1. Check if the game exists
2. Get `game.id` for the duplicate-join check and the `joinGameByCode` call

The RPC returns `id`, `name`, `description`, `status`, `host_user_id` — enough for both purposes. The `code` field is intentionally excluded from the RPC return since it's the lookup key.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/004_restrict_games_select.sql` | **New** — replace global SELECT policy + add RPC |
| `src/lib/database.ts` | Update `findGameByCode` to use RPC |

---

## Acceptance Criteria

- [ ] `"Anyone can view games"` policy is dropped
- [ ] New SELECT policies are scoped to hosts and members only
- [ ] `lookup_game_by_code` RPC exists and returns game info without the code field
- [ ] A user who is NOT a member of any game sees zero games when querying `SELECT * FROM games`
- [ ] A user who IS a member sees only their games
- [ ] Join-by-code flow still works: enter code -> find game -> join -> see game in list
- [ ] Migration applies cleanly: `supabase db push` or `supabase migration up`
- [ ] `yarn compile` passes

---

## Testing Strategy

1. **Manual test:** Sign in as User A, create a game. Sign in as User B (not in any game), run `supabase.from("games").select("*")` — should return empty.
2. **Manual test:** User B joins User A's game via code. Now `select("*")` returns that one game.
3. **Manual test:** Join-by-code flow works end-to-end through the UI.

---

## Risks

- **Breaking existing queries:** Any code that does `supabase.from("games").select("*")` expecting all games (like `getAllGames`) will now only return the user's games. This is actually the correct behavior — `getAllGames` in `database.ts:96` is only used in contexts where the user's games are wanted.
- **RPC permissions:** The `SECURITY DEFINER` function runs as the function owner, bypassing RLS. This is intentional — it allows the join-code lookup to work before the user is a member.
