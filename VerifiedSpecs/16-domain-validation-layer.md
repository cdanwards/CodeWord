# Spec 16: Domain Validation Layer

**Phase:** 6.3 (Architecture Refactoring)
**Priority:** High — no invariant enforcement currently exists
**Effort:** 4-6 hours
**Dependencies:** Spec 14 (split database module), Spec 07 (status constraints)
**Blocked by:** Spec 14 completion

---

## Objective

Add a validation layer between the UI and database that enforces game domain invariants using Zod schemas and business rules. Currently, any status string can be written, games can be joined regardless of state, and user inputs aren't validated beyond basic length checks.

---

## Current Gaps

1. **No game state transition enforcement:** `games.status` can be set to any string
2. **No join eligibility checks:** A player can join a game that's already started or completed
3. **No input validation:** Game names, descriptions, and profile fields go straight to Supabase
4. **No elimination validation:** A player can record an elimination against someone not assigned to them

---

## Required Changes

### 1. Input validation schemas

**New file:** `src/lib/validation/schemas.ts`

```typescript
import { z } from "zod"
import type { GameStatus, UserGameStatus, AssignmentStatus } from "@/types/game-status"

// Game creation input
export const createGameSchema = z.object({
  name: z.string().trim().min(1, "Game name is required").max(100, "Game name too long"),
  description: z.string().trim().max(500, "Description too long").optional(),
  durationHours: z.number().int().min(1).max(720).default(72), // 1 hour to 30 days
})

// Join game input
export const joinGameCodeSchema = z
  .string()
  .trim()
  .length(6, "Game code must be 6 characters")
  .regex(/^[A-Z0-9]+$/, "Game code must be uppercase letters and numbers")

// Profile update input
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(256).optional(),
  bio: z.string().trim().max(1000).optional(),
})
```

### 2. Game state machine

**New file:** `src/lib/validation/game-rules.ts`

```typescript
import type { GameStatus } from "@/types/game-status"

// Valid state transitions
const VALID_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  lobby: ["pending", "cancelled"],
  pending: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],    // terminal
  cancelled: [],    // terminal
}

export function canTransition(from: GameStatus, to: GameStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function canJoinGame(gameStatus: GameStatus): boolean {
  return gameStatus === "lobby"
}

export function canStartGame(gameStatus: GameStatus, memberCount: number): boolean {
  return gameStatus === "lobby" && memberCount >= 3 // minimum players for assassin
}

export function canRecordElimination(gameStatus: GameStatus): boolean {
  return gameStatus === "active"
}
```

### 3. Validated service functions

**New file:** `src/lib/validation/index.ts`

These wrap database calls with validation:

```typescript
import { createGameSchema, joinGameCodeSchema } from "./schemas"
import { canJoinGame } from "./game-rules"
import { gamesDb } from "@/lib/db/games"
import { userGamesDb } from "@/lib/db/user-games"
import { err, ok } from "@/lib/db/types"
import type { Result } from "@/lib/db/types"

export async function validateAndCreateGame(input: {
  name: string
  description?: string
  durationHours?: number
}): Promise<Result<Game>> {
  // Validate input
  const parsed = createGameSchema.safeParse(input)
  if (!parsed.success) {
    return err(parsed.error.errors[0].message)
  }

  // Delegate to database
  return gamesDb.createGameHost(parsed.data)
}

export async function validateAndJoinGame(
  userId: string,
  code: string,
): Promise<Result<UserGame>> {
  // Validate code format
  const parsedCode = joinGameCodeSchema.safeParse(code)
  if (!parsedCode.success) {
    return err(parsedCode.error.errors[0].message)
  }

  // Check game exists and is joinable
  const gameResult = await gamesDb.findGameByCode(parsedCode.data)
  if (gameResult.error) return err(gameResult.error)
  if (!gameResult.data) return err("Game not found")

  if (!canJoinGame(gameResult.data.status as GameStatus)) {
    return err("This game has already started and is no longer accepting players")
  }

  // Check not already a member
  const membersResult = await userGamesDb.getGameMembers(gameResult.data.id)
  if (membersResult.error) return err(membersResult.error)
  const alreadyMember = membersResult.data.some((m) => m.userId === userId)
  if (alreadyMember) return err("You are already in this game")

  // Join
  return userGamesDb.joinGameByCode(userId, parsedCode.data)
}
```

### 4. Update UI components to use validated functions

**Files to update:**
- `src/components/CreateGameModal.tsx` — use `validateAndCreateGame` instead of `db.createGameHost`
- `src/components/JoinGameModal.tsx` — use `validateAndJoinGame` instead of inline validation + `db.joinGameByCode`

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/validation/schemas.ts` | **New** — Zod input validation schemas |
| `src/lib/validation/game-rules.ts` | **New** — game state machine and business rules |
| `src/lib/validation/index.ts` | **New** — validated service functions |
| `src/types/game-status.ts` | May already exist from Spec 07 — verify and extend if needed |
| `src/components/CreateGameModal.tsx` | Use `validateAndCreateGame` |
| `src/components/JoinGameModal.tsx` | Use `validateAndJoinGame` |

---

## Acceptance Criteria

- [ ] Game creation validates: name required, name length, description length, duration range
- [ ] Join game validates: code format, game exists, game is in "lobby" status, user not already member
- [ ] Game status transitions follow the defined state machine
- [ ] Invalid inputs return clear, user-friendly error messages
- [ ] All validation uses Zod schemas (not inline checks)
- [ ] `yarn compile` passes
- [ ] `yarn test` passes

---

## Risks

- **Over-validation:** Don't add validation that blocks legitimate use cases. For example, don't validate game names against a character whitelist — just check length.
- **Duplicate validation:** The database has CHECK constraints (from Spec 07). The app-level validation provides better error messages; the DB constraints are the safety net. Both should exist.
