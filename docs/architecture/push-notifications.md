# Push notifications

Game events reach agents as pushes, even with the app closed. The design and its trade-offs are in [ADR 0004](../adr/0004-push-notifications-outbox.md); this page is the working guide.

## Flow

```
engine function or cron tick
  -> row change on user_games / games / agent_words / eliminations / game_results
  -> trigger writes notifications row (skips the agent who caused it)
  -> statement trigger: pg_net POST {functions_url}/send-push   (sent after commit)
  -> send-push: claim_push_batch -> Expo push API -> mark sent, drop dead tokens
  -> device shows the banner; tapping it opens /game/<gameId>
```

The once-a-minute `codeword-tick` cron job runs `_tick()`: it calls `_sync_game` on every active game (issuing daily words, ending timed-out games) and pokes `send-push` if anything is still unsent.

## Pieces

| Piece | Where | Notes |
|---|---|---|
| Outbox and tokens | `notifications`, `push_tokens` (migration 009) | Agents can read their own notifications. Nobody reads `push_tokens` directly. |
| Triggers | `_notify_on_join`, `_notify_on_start`, `_notify_on_word`, `_notify_on_report`, `_notify_on_verdict`, `_notify_on_result` | Message text lives here. `_notify` skips `auth.uid()`. |
| Client RPCs | `register_push_token(token, platform)`, `unregister_push_token(token)` | Wrapped as `db.registerPushToken` / `db.unregisterPushToken`. |
| Delivery | `supabase/functions/send-push/index.ts` | Accepts only the service role key. Ticket handling is in `messages.ts` (tested by `test/send-push.test.ts`). |
| App | `src/lib/notifications.ts` | Permission, token registration, tap handling, refresh on push. |

## In the app

- The game screen asks for notification permission the first time an agent opens an operation (`registerForPush({ prompt: true })`). iOS only shows that prompt once.
- The signed-in layout renders `PushNotifications`, which re-registers the token silently on launch (so a device that changes hands moves to the new agent) and opens the game when a push is tapped, including the tap that launched the app.
- While a game is open, a push about that game refreshes it at once (`usePushesForGame`).
- Pushes show as banners even in the foreground.
- `signOut` calls `unregisterFromPush()` first, while the session can still remove the token.

Push payload `data`: `{ notificationId, gameId, kind }`. `kind` is one of `agent_joined`, `game_started`, `word_issued`, `report_incoming`, `report_confirmed`, `report_disputed`, `game_over`.

## Local development

`supabase/seed.sql` stores the two Vault secrets for the local stack (`http://kong:8000/functions/v1` and the fixed local service role key), so `supabase db reset` wires delivery up.

`supabase start` serves `supabase/functions/` and loads `supabase/functions/.env`. Copy the example:

```bash
cp supabase/functions/.env.example supabase/functions/.env
supabase stop && supabase start
```

The example points `EXPO_PUSH_URL` at a stand-in on port 4599 instead of Expo. Then:

```bash
node scripts/push-check.mjs            # delivery checks: join, start, dead tokens, auth
node scripts/push-check.mjs --listen   # print every push the function sends while you play
```

The iOS simulator can't get an Expo push token, but it can show a push. To see what an agent would get, send one with `xcrun simctl push`:

```json
{
  "Simulator Target Bundle": "com.codewordapp",
  "aps": { "alert": { "title": "You've been made", "body": "Bob Martinez says you said a codeword. Confirm or dispute it." }, "sound": "default" },
  "body": { "notificationId": 1, "gameId": 6, "kind": "report_incoming" }
}
```

Expo puts `data` under the `body` key of the APNs payload, which is why the stand-in payload does too.

## Real devices

1. `eas init` to create the Expo project, and set `EAS_PROJECT_ID` in `.env.local` (read by `app.config.ts`).
2. Let EAS manage push credentials (`eas credentials`, or the first `eas build` for a device).
3. Remove `EXPO_PUSH_URL` from `supabase/functions/.env` so the function talks to Expo.
4. The phone must reach the backend, so this is easiest with a hosted project.

## Hosted project

```bash
supabase functions deploy send-push
```

Then, in the SQL editor:

```sql
SELECT vault.create_secret('https://<ref>.supabase.co/functions/v1', 'codeword_functions_url');
SELECT vault.create_secret('<service role key>', 'codeword_service_role_key');
```

Set `EXPO_ACCESS_TOKEN` with `supabase secrets set` only if enhanced push security is on for the Expo project.

## Debugging

```sql
-- what's queued or stuck
SELECT id, user_id, kind, attempts, claimed_at, sent_at, last_error FROM notifications ORDER BY id DESC LIMIT 20;
-- what pg_net got back from send-push
SELECT status_code, content, error_msg FROM net._http_response ORDER BY id DESC LIMIT 5;
-- the scheduler
SELECT status, return_message, start_time FROM cron.job_run_details ORDER BY runid DESC LIMIT 5;
```

`last_error = 'No registered devices'` is normal for agents who never allowed notifications. Function logs: `docker logs supabase_edge_runtime_CodeWord`.
