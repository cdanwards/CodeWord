# ADR 0004: Push notifications through a database outbox

- Status: accepted
- Date: 2026-10-13
- Implemented in: `supabase/migrations/009_push_notifications.sql`, `supabase/functions/send-push/`, `src/lib/notifications.ts`

## Context

Word Assassins plays out over days. Before this change an agent only learned that someone had reported them, that their own report was settled, or that the game had ended when they opened the app and the game screen polled. A report could sit unanswered for hours, and the victim kept playing a game they had already lost.

Three places could decide when to notify:

- The client, after its own action ("I reported Bob, so tell Bob"). That trusts a modified client and misses events with no client behind them, such as a day turning over.
- Each engine function, by calling a sender directly. Delivery is network I/O inside a game transaction, and every function in migration 005 would need editing.
- The database, by reacting to the rows the engine writes. The engine stays unchanged, and every path that changes game state (functions, the scheduler, a future admin tool) produces the same notifications.

## Decision

Triggers on the engine tables write rows to a `notifications` outbox. Delivery is separate:

1. An `AFTER INSERT ... FOR EACH STATEMENT` trigger on `notifications` asks pg_net to POST to the `send-push` Edge Function. pg_net sends after the transaction commits.
2. `send-push` claims a batch with `claim_push_batch` (`FOR UPDATE SKIP LOCKED`), sends one Expo push per registered device, marks rows sent, and deletes tokens Expo reports as `DeviceNotRegistered`.
3. A pg_cron job (`codeword-tick`, every minute) retries anything unsent and brings active games up to date with `_sync_game`.

Events and recipients:

| Event | Source | Who hears about it |
|---|---|---|
| A recruit joins the lobby | insert on `user_games` | The host |
| The operation starts | `games.status` lobby to active | Every member but the host |
| A new day's word is issued (day 2 on) | insert on `agent_words` | The holder |
| A kill report is filed | insert on `eliminations` | The target |
| The target confirms | `eliminations.confirmation_status` to confirmed | The killer, unless that kill ended the game |
| The target disputes | to rejected | The killer |
| The operation ends | insert on `game_results` | Every member; the winner gets "You won" |

Whoever caused an event (`auth.uid()`) is never notified about it. The confirm trigger is deferred to commit, so a final kill is announced once, as the end of the operation.

Pushes go through Expo's push service, so the server holds no APNs or FCM credentials. Devices register an Expo push token through `register_push_token`. A token belongs to one agent at a time, and signing out removes it.

## Consequences

- Day turnovers and time limits now happen within a minute even when nobody has the app open. ADR 0002's "applied lazily, no cron" still holds for reads, and the tick adds a floor under it.
- Delivery problems never fail a game action: `_dispatch_push` swallows errors and the tick retries. A row is given up on after five attempts.
- Hosted projects need two Vault secrets (`codeword_functions_url`, `codeword_service_role_key`) and the function deployed. Without them rows stay queued and nothing is sent.
- Real pushes need the EAS project ID (`extra.eas.projectId` in `app.json`) and a physical device. The simulator gets the permission prompt and displays simulated pushes, but can't get a token.
- Expo push receipts (the second, delayed delivery report) are not checked yet, so a token Apple rejects later is only noticed on the next send.
- The game screen still polls every 8 seconds. A push about the open game triggers an immediate refresh.
