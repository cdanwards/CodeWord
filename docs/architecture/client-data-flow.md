# Client data flow

## The `db` boundary

All data access is in `src/lib/database.ts`. It exists to enforce two rules the Supabase client can't:

1. **Case conversion.** Postgres columns are snake_case; app types are camelCase. Every row returned goes through `fromRow()` (deep, so embedded relations and engine JSON convert too); every camelCase payload sent goes through `toRow()`. Nothing outside this file should see `user_id` or send `{ gameId }`. The client is untyped, so TypeScript can't catch a miss.
2. **Errors don't throw into screens.** Reads return `null` or `[]` on failure and log. Engine actions return an `ActionResult`:

```ts
type ActionResult<T = void> = { ok: true; data: T } | { ok: false; message: string }
```

The engine raises readable messages ("That is not one of your codewords", "Only the host can start the operation"), so screens show `message` directly.

Expected misses are not errors: lookups that may find nothing (`findGameByCode`, `getUserProfile`) use `.maybeSingle()`.

## Plain table access

Used for things the client is allowed to do itself:

| Helper | Table | Used by |
|---|---|---|
| `getUserGames(userId)` | `user_games` + embedded `games` | HQ, Case files, Agent |
| `createGameHost({ name, description, durationHours })` | `games`, `user_games` | Create sheet; generates a unique six-character code from an alphabet without O/0/I/1 |
| `joinGameByCode(userId, code)` | `user_games` | Join sheet (RLS only allows joining in the lobby) |
| `getUserProfile`, `ensureUserProfile`, `updateUserProfile` | `user_profiles` | Auth provider, Agent |

## Game engine calls

| Helper | Engine function | Returns |
|---|---|---|
| `getMission(gameId)` | `my_mission` | `Mission`: game, you, target, your words, pending reports, outcome |
| `getBoard(gameId)` | `game_board` | `Board`: roster with kill counts, kill feed |
| `startGame(gameId)` | `start_game` | `ActionResult` |
| `reportElimination({ gameId, word, notes })` | `report_elimination` | `ActionResult<number>` (report id) |
| `respondToElimination({ eliminationId, confirmed, note })` | `respond_to_elimination` | `ActionResult` |
| `endGame(gameId)` | `end_game` | `ActionResult` |

`Mission` and `Board` are defined at the bottom of `supabase/schema.ts`. Keep them in step with the JSON built in `005_game_engine.sql`.

## The game screen

`src/app/(app)/game/[id].tsx` owns loading for one operation:

1. On focus it calls `getMission` and `getBoard` together, then again every 8 seconds until the screen loses focus. That's how another agent's actions (a report against you, a new target) arrive.
2. It picks exactly one view:

| Condition, checked in order | View |
|---|---|
| `game.status === "lobby"` | `LobbyView` |
| `game.status` is `ended` or `canceled` | `DebriefView` |
| `me.status !== "active"` | `EliminatedView` |
| `mission.incoming` is set | `IncomingReportView` |
| otherwise | `MissionView` |

3. Each view gets `{ mission, board, onChanged }` (`GameViewProps`). After a successful action a view calls `onChanged()` to refresh at once instead of waiting for the next poll.

Secrets in the UI: `MissionView` keeps your codewords redacted until you press and hold, and the kill feed shows a redaction bar wherever the engine withheld the word.

## Other screens

- **HQ** reloads your games whenever it comes into focus, features the live operation (else the newest lobby), and calls `getMission` for it to show your target's name.
- **Case files** filters `getUserGames` locally by status.
- **Join / Create** are bottom sheets; their inputs use `SheetTextInput` so the sheet moves with the keyboard.
