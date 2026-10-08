# Spec 20: Test Suite — Database Modules + Domain Validation

**Phase:** 7.2 + 7.3 (Testing Foundation)
**Priority:** High — zero database test coverage currently
**Effort:** 4-6 hours
**Dependencies:** Spec 14 (split database), Spec 15 (typed errors), Spec 16 (validation layer)
**Blocked by:** Phase 6 completion

---

## Objective

Write unit tests for the split database modules and the domain validation layer. Mock Supabase at the client level to test logic without network calls.

---

## Test Files

```
src/lib/db/__tests__/
  games.test.ts
  user-games.test.ts
  profiles.test.ts
src/lib/validation/__tests__/
  schemas.test.ts
  game-rules.test.ts
```

---

## Mock Setup

Mock the Supabase client at the module level:

```typescript
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    order: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
  })),
  auth: {
    getUser: jest.fn(),
  },
}

jest.mock("../../../supabase/database", () => ({
  supabase: mockSupabase,
}))
```

---

## Test Cases: `games.test.ts`

### createGameHost

| Test | Setup | Assert |
|------|-------|--------|
| Successful creation | Mock insert -> game object | Returns `ok(game)` with generated code |
| No authenticated user | Mock `getUser` -> null | Returns `err("...")` |
| Code collision + retry | Mock first insert -> error 23505, second -> success | Returns `ok(game)` on second attempt |
| All retries exhausted | Mock all inserts -> error 23505 | Returns `err("...")` |
| Database error | Mock insert -> other error | Returns `err("...")` with error message |

### findGameByCode

| Test | Setup | Assert |
|------|-------|--------|
| Game found | Mock RPC -> game data | Returns `ok(game)` |
| Game not found | Mock RPC -> no rows | Returns `ok(null)` |
| Database error | Mock RPC -> error | Returns `err("...")` |

### getGame

| Test | Setup | Assert |
|------|-------|--------|
| Game exists | Mock select -> game | Returns `ok(game)` |
| Game not found | Mock select -> PGRST116 | Returns `ok(null)` |

---

## Test Cases: `user-games.test.ts`

### joinGameByCode

| Test | Setup | Assert |
|------|-------|--------|
| Successful join | Mock findGameByCode + insert | Returns `ok(userGame)` |
| Game not found | Mock findGameByCode -> null | Returns error about game not found |
| Insert failure | Mock findGameByCode -> game, insert -> error | Returns `err("...")` |

### getUserGames

| Test | Setup | Assert |
|------|-------|--------|
| Has games | Mock select -> array of user games with joined game data | Returns `ok([...])` |
| No games | Mock select -> empty array | Returns `ok([])` |
| Query error | Mock select -> error | Returns `err("...")` (NOT empty array) |

### getGameMembers

| Test | Setup | Assert |
|------|-------|--------|
| Has members | Mock select -> array with user_profiles join | Returns `ok([...])` |
| No members | Mock select -> empty array | Returns `ok([])` |

---

## Test Cases: `profiles.test.ts`

### ensureUserProfile

| Test | Setup | Assert |
|------|-------|--------|
| Profile exists | Mock getUserProfile -> profile | Returns existing profile, no insert called |
| Profile doesn't exist | Mock getUserProfile -> null, createUserProfile -> profile | Creates and returns new profile |
| Create fails | Mock getUserProfile -> null, createUserProfile -> error | Returns `err("...")` |

---

## Test Cases: `schemas.test.ts`

### createGameSchema

| Test | Input | Assert |
|------|-------|--------|
| Valid input | `{ name: "My Game", durationHours: 72 }` | Parses successfully |
| Empty name | `{ name: "" }` | Fails with "Game name is required" |
| Name too long | `{ name: "x".repeat(101) }` | Fails with "Game name too long" |
| Invalid duration | `{ name: "OK", durationHours: 0 }` | Fails |
| Missing name | `{}` | Fails |

### joinGameCodeSchema

| Test | Input | Assert |
|------|-------|--------|
| Valid code | `"ABC123"` | Parses to "ABC123" |
| Lowercase | `"abc123"` | Fails (must be uppercase) |
| Wrong length | `"AB"` | Fails |
| Special chars | `"ABC!23"` | Fails |

---

## Test Cases: `game-rules.test.ts`

### canTransition

| Test | From | To | Assert |
|------|------|----|--------|
| Lobby to active | lobby | active | false (must go through pending) |
| Lobby to pending | lobby | pending | true |
| Pending to active | pending | active | true |
| Active to completed | active | completed | true |
| Completed to anything | completed | active | false (terminal) |

### canJoinGame

| Test | Status | Assert |
|------|--------|--------|
| Lobby | lobby | true |
| Active | active | false |
| Completed | completed | false |

### canStartGame

| Test | Status + Members | Assert |
|------|-----------------|--------|
| Lobby with 3 | lobby, 3 | true |
| Lobby with 2 | lobby, 2 | false (need 3+) |
| Active | active, 5 | false |

---

## Acceptance Criteria

- [ ] All test files exist in their respective `__tests__/` directories
- [ ] All test cases pass
- [ ] Tests use mocked Supabase — no real network calls
- [ ] Tests verify `Result<T>` return types (both `ok` and `err` paths)
- [ ] Validation tests cover all edge cases in Zod schemas
- [ ] Game rule tests cover all state transitions
- [ ] `yarn test` passes
- [ ] Coverage for database modules > 80%
- [ ] Coverage for validation modules > 90%

---

## Risks

- **Mock chain complexity:** Supabase's fluent API (`from().select().eq().single()`) requires careful mock chaining. Consider a helper that sets up the full chain for common patterns.
