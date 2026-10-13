// Drains the notifications outbox (migration 009) into Expo's push service.
//
// Called by the database through pg_net whenever notifications are queued, and once a minute by
// the codeword-tick cron job. Only the service role key is accepted.
//
// Env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase. EXPO_ACCESS_TOKEN is
// optional (needed only if push security is turned on for the Expo project). EXPO_PUSH_URL
// overrides Expo's endpoint; scripts/push-check.mjs points it at a local stand-in.
// Deno resolves npm: specifiers; the app's ESLint resolver doesn't.
// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js@2"

import { buildMessages, chunk, type ExpoTicket, type OutboxRow, settle } from "./messages.ts"

const EXPO_PUSH_URL = Deno.env.get("EXPO_PUSH_URL") || "https://exp.host/--/api/v2/push/send"
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN")
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Upper bound on batches per call so one request can't run forever.
const MAX_ROUNDS = 10

Deno.serve(async (req) => {
  if (!SERVICE_ROLE_KEY || req.headers.get("Authorization") !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  let processed = 0
  let sent = 0
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const { data, error } = await supabase.rpc("claim_push_batch", { p_limit: 100 })
    if (error) return Response.json({ error: error.message, processed }, { status: 500 })
    const rows = (data ?? []) as OutboxRow[]
    if (rows.length === 0) break
    processed += rows.length
    sent += await deliver(rows)
  }
  return Response.json({ processed, sent })
})

async function deliver(rows: OutboxRow[]): Promise<number> {
  const { messages, owners } = buildMessages(rows)
  const tickets: ExpoTicket[] = []

  for (const batch of chunk(messages)) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...(EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${EXPO_ACCESS_TOKEN}` } : {}),
        },
        body: JSON.stringify(batch),
      })
      const payload = await response.json()
      if (!response.ok || !Array.isArray(payload?.data)) {
        throw new Error(payload?.errors?.[0]?.message ?? `Expo answered ${response.status}`)
      }
      tickets.push(...payload.data)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      tickets.push(...batch.map((): ExpoTicket => ({ status: "error", message })))
    }
  }

  const { sent, retry, deadTokens } = settle(rows, messages, owners, tickets)
  const now = new Date().toISOString()

  const clean = sent.filter((s) => s.error === null).map((s) => s.id)
  if (clean.length > 0) {
    await supabase.from("notifications").update({ sent_at: now }).in("id", clean)
  }
  for (const s of sent.filter((s) => s.error !== null)) {
    await supabase
      .from("notifications")
      .update({ sent_at: now, last_error: s.error })
      .eq("id", s.id)
  }
  // A failed row keeps its claim, so the claim timeout in claim_push_batch spaces out retries.
  for (const r of retry) {
    await supabase.from("notifications").update({ last_error: r.error }).eq("id", r.id)
  }
  if (deadTokens.length > 0) {
    await supabase.from("push_tokens").delete().in("token", deadTokens)
  }
  return sent.length
}
