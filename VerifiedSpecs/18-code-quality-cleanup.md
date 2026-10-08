# Spec 18: Code Quality Cleanup (Console Logging + Theme Consistency)

**Phase:** 6.5 + 6.6 (Architecture Refactoring)
**Priority:** Medium
**Effort:** 3-4 hours
**Dependencies:** Specs 06 (UI bug fixes — already handles some colors)
**Blocked by:** Phase 5 completion

---

## Objective

1. Gate all console logging behind `__DEV__` or remove it
2. Replace all hardcoded hex colors with theme system values

---

## Part A: Console Logging Cleanup

### Scope

98 `console.*` calls across 16 files. Highest density files:

| File | Count | Nature |
|------|-------|--------|
| `src/stores/authStore.ts` | ~8 | Debug traces for sign in/out flow |
| `src/lib/database.ts` | ~30 | Error logging for every DB operation |
| `src/lib/network-utils.ts` | ~10 | Network state logging |
| `src/lib/network-test.ts` | ~8 | Network test results |
| `src/components/AuthProvider.tsx` | ~3 | Auth state change logging |
| `src/components/CreateGameModal.tsx` | ~6 | Game creation debug timing |
| `src/screens/GamesScreen.tsx` | ~6 | Game loading debug |
| `supabase/database.ts` | ~8 | Supabase config debug |
| `src/lib/auth-client.ts` | ~1 | Sign out debug |

### Rules

1. **Remove entirely:** Debug traces that only log "entering function X" (e.g., `console.log("[authStore] signOut")`)
2. **Gate with `__DEV__`:** Diagnostic info useful during development (e.g., network status, timing)
3. **Keep as-is:** Nothing — production code should not log to console. Use crash reporting for real errors.

### Specific Changes

**`supabase/database.ts` (lines 11-23):** Delete the entire Supabase Config Debug block:
```typescript
// DELETE ALL OF THIS:
console.log("Supabase Config Debug:")
console.log("- Constants.expoConfig?.extra?.supabaseUrl:", ...)
// ... 6 more lines
```

**`src/stores/authStore.ts`:** Remove all `console.log("[authStore]` lines (lines 175, 181, 183, 187, 190, 194).

**`src/components/CreateGameModal.tsx`:** Remove or gate all `console.log("[CreateGameModal]"` lines (lines 58, 67, 75, 85, 89, 94).

**`src/screens/GamesScreen.tsx`:** Remove all `console.log("=== loadGames"`, `console.log("Auth state:"`, etc. (lines 32, 34, 44, 55).

**`src/lib/auth-client.ts` (line 42):** Remove `console.log("[authClient] signOut")`.

**Database modules (post Spec 14):** The `console.error` calls in each DB function will be replaced by the `Result<T>` pattern in Spec 15. If Spec 15 is already done, these are already gone. If not, gate them with `__DEV__`.

---

## Part B: Theme Consistency

### Hardcoded Colors to Replace

Scan all files for hex color literals. Key offenders (excluding files already fixed in Spec 06):

**`src/screens/GamesScreen.tsx`:**
| Line | Current | Theme Equivalent |
|------|---------|-----------------|
| 173 | `backgroundColor: "#f5f5f5"` ($gameItem) | `colors.palette.neutral200` or similar |
| 180 | `color: "#666"` ($gameDescription) | `colors.textDim` |
| 184 | `color: "#007AFF"` ($gameCode) | `colors.tint` |
| 190 | `color: "#666"` ($gameRole) | `colors.textDim` |
| 196 | `color: "#666"` ($emptyListText) | `colors.textDim` |

**`src/components/CreateGameModal.tsx`:**
| Line | Current | Theme Equivalent |
|------|---------|-----------------|
| 199 | `color: "#D32F2F"` ($errorText) | `colors.error` |

**`src/components/JoinGameModal.tsx`** (after Spec 06 removes debug colors):
| Line | Current | Theme Equivalent |
|------|---------|-----------------|
| 159 | `backgroundColor: "#E0E0E0"` ($handleIndicator) | `colors.palette.neutral400` |
| 180 | `color: "#D32F2F"` ($errorText) | `colors.error` |

### Approach

For components that are already using `themed()` or `useAppTheme()`, add the theme colors through the existing pattern. For components that don't use the theme yet, convert their style objects to use the theme.

**Pattern:**
```typescript
// Before:
const $gameItem = { backgroundColor: "#f5f5f5" }

// After (using themed function if available):
function $gameItem(theme: Theme) {
  return { backgroundColor: theme.colors.palette.neutral200 }
}

// Or if using useAppTheme():
const { colors } = useAppTheme()
const $gameItem = { backgroundColor: colors.palette.neutral200 }
```

Check the existing theme system in `src/theme/` to understand the available color tokens and the `themed()` pattern before making changes.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/database.ts` | Remove Supabase config debug logging |
| `src/stores/authStore.ts` | Remove debug traces |
| `src/components/CreateGameModal.tsx` | Remove debug logs, use theme colors for error text |
| `src/components/JoinGameModal.tsx` | Use theme colors for handle indicator and error text |
| `src/screens/GamesScreen.tsx` | Remove debug logs, use theme colors |
| `src/lib/auth-client.ts` | Remove signOut debug log |
| `src/lib/network-utils.ts` | Gate with `__DEV__` or remove |
| `src/lib/network-test.ts` | Gate with `__DEV__` or remove |
| `src/components/AuthProvider.tsx` | Gate auth state change log with `__DEV__` |

---

## Acceptance Criteria

- [ ] Zero `console.log`/`console.warn`/`console.error` calls outside of `__DEV__` guards
- [ ] Zero hardcoded hex color values in `src/screens/` or `src/components/`
- [ ] All colors come from the theme system (`useAppTheme()`, `themed()`, or theme constants)
- [ ] Dark mode (if implemented) would work correctly with the theme colors
- [ ] `yarn compile` passes
- [ ] `yarn lint:check` passes

---

## Risks

- **Theme token mapping:** Need to verify what color tokens actually exist in `src/theme/`. Don't invent tokens that don't exist — use the closest available.
- **Visual regression:** Replacing colors may subtly change the look. Compare before/after screenshots.
