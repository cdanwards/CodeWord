# Spec 06: UI Bug Fixes (Debug Colors + Member List)

**Phase:** 2 (Critical Fixes)
**Priority:** Critical (debug colors ship to production) + Medium (member list wrong data)
**Effort:** 1-2 hours
**Dependencies:** Spec 01
**Blocked by:** Phase 1 completion

---

## Objective

Fix two UI bugs identified by multiple evaluators:
1. Debug colors in `JoinGameModal` that will render in production
2. `GameDetailScreen` member list showing game name instead of user name

---

## Bug 1: Debug Colors in JoinGameModal

**File:** `src/components/JoinGameModal.tsx` (lines 148-157)

**Current code:**
```typescript
const $sheet = {
  backgroundColor: "#FF00FF", // Bright magenta background
  flex: 1,
}

const $content = {
  padding: 16,
  flex: 1,
  backgroundColor: "#00FFFF", // Bright cyan background
}
```

**Problem:** These are debug artifacts left from development. They will render as bright magenta and cyan backgrounds in production builds.

**Fix:** Replace with theme-appropriate colors. Reference the theme system used in other components (`useAppTheme()` / `themed()`). For a bottom sheet:

```typescript
const $sheet = {
  flex: 1,
}

const $content = {
  padding: 16,
  flex: 1,
}
```

The background color should come from the `BottomSheetModal`'s `backgroundStyle` prop or the theme's surface color. Check how `CreateGameModal.tsx` handles its styling (it uses plain `$sheet` without any background color — lines 169-172).

**Also fix:** The `$errorText` on line 180 uses hardcoded `#D32F2F`:
```typescript
const $errorText = {
  color: "#D32F2F",
}
```
Replace with a theme color for error text.

---

## Bug 2: GameDetailScreen Member List Shows Game Name

**File:** `src/app/(app)/game/[id].tsx` (line 65)

**Current code:**
```typescript
function renderMember({ item }: { item: UserGameWithGame }) {
  return (
    <View style={$memberItem}>
      <Text preset="default" text={item.games.name} />  // <-- SHOWS GAME NAME
      <Text preset="formHelper" text={`Role: ${item.role}`} style={$memberRole} />
    </View>
  )
}
```

**Problem:** `item.games` is the joined `Game` record. `item.games.name` is the game's name, not the member's name. Every row in the Members list shows the game name.

**Root cause:** `getGameMembers` in `src/lib/database.ts:292-314` joins `games (*)` instead of `user_profiles`.

### Fix Part A: Update the database query

**File:** `src/lib/database.ts`

```typescript
// Before (line 296-299):
.select(`
  *,
  games (*)
`)

// After:
.select(`
  *,
  user_profiles!user_games_user_id_fkey (
    full_name,
    avatar_url
  )
`)
```

**Note:** The foreign key name `user_games_user_id_fkey` comes from `001_update_for_supabase_auth.sql:50`. Verify this is the correct constraint name. If Supabase can't resolve the relationship, use the table name directly: `user_profiles!inner (full_name, avatar_url)` and filter with `.eq("user_id", "user_profiles.user_id")`.

**Alternative approach if the FK relationship doesn't resolve:** Since `user_games.user_id` matches `user_profiles.user_id` but there's no direct FK between them (both reference `auth.users`), you may need a two-step approach:
1. Fetch `user_games` for the game
2. Fetch `user_profiles` for the user IDs
3. Join client-side

### Fix Part B: Update the type and render

**File:** `src/app/(app)/game/[id].tsx`

```typescript
// Update type
type UserGameWithProfile = UserGame & {
  user_profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

// Update render
function renderMember({ item }: { item: UserGameWithProfile }) {
  const displayName = item.user_profiles?.full_name || "Unknown Player"
  return (
    <View style={$memberItem}>
      <Text preset="default" text={displayName} />
      <Text preset="formHelper" text={`Role: ${item.role}`} style={$memberRole} />
    </View>
  )
}
```

### Fix Part C: Replace hardcoded colors with theme

While in this file, replace all hardcoded hex colors with theme values:

| Current | Location | Replacement |
|---------|----------|-------------|
| `"#666"` | `$gameDescription`, `$gameStatus`, `$memberRole`, `$wordDay` | Theme secondary text color |
| `"#007AFF"` | `$gameCode` | Theme primary/accent color |
| `"#f5f5f5"` | `$memberItem`, `$wordItem` | Theme surface/card color |
| `"#999"` | `$emptyText` | Theme muted text color |

### Fix Part D: Replace FlatList with map()

Both FlatLists in this screen have `scrollEnabled={false}` inside a `preset="scroll"` Screen, which defeats virtualization. Replace with:

```typescript
// Before:
<FlatList
  data={members}
  renderItem={renderMember}
  keyExtractor={(item) => `${item.userId}-${item.gameId}`}
  style={$membersList}
  scrollEnabled={false}
/>

// After:
{members.map((item) => (
  <View key={`${item.userId}-${item.gameId}`}>
    {renderMember({ item })}
  </View>
))}
```

Same for the words FlatList.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/JoinGameModal.tsx` | Remove debug colors, use theme colors |
| `src/lib/database.ts` | Update `getGameMembers` to join `user_profiles` instead of `games` |
| `src/app/(app)/game/[id].tsx` | Fix member render, replace hardcoded colors, replace disabled FlatLists |

---

## Acceptance Criteria

- [ ] No `#FF00FF` or `#00FFFF` in the codebase
- [ ] JoinGameModal renders with appropriate theme colors
- [ ] GameDetailScreen member list shows user names (from `user_profiles.full_name`)
- [ ] GameDetailScreen member list shows a fallback ("Unknown Player") for members without profiles
- [ ] No `scrollEnabled={false}` FlatLists inside scrollable Screens
- [ ] No hardcoded hex colors in `GameDetailScreen` or `JoinGameModal`
- [ ] `yarn compile` passes

---

## Risks

- **user_profiles join:** The FK relationship between `user_games` and `user_profiles` goes through `auth.users` (both have `user_id -> auth.users.id`). Supabase may not auto-detect this relationship. If the join fails, use a client-side approach or create a database view.
