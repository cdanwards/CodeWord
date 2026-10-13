// Pure helpers for the send-push function. No Deno or network APIs here, so Jest can test them
// (test/send-push.test.ts).

/** One outbox row as returned by claim_push_batch (migration 009). */
export interface OutboxRow {
  id: number
  user_id: string
  game_id: number | null
  kind: string
  title: string
  body: string
  tokens: string[]
}

/** Payload the app reads when a notification is tapped (src/lib/notifications.ts). */
export interface PushData {
  notificationId: number
  gameId: number | null
  kind: string
}

export interface ExpoMessage {
  to: string
  title: string
  body: string
  sound: "default"
  data: PushData
}

export type ExpoTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; details?: { error?: string } }

export interface Settlement {
  /** Done: delivered to at least one device, or nothing left to try. */
  sent: { id: number; error: string | null }[]
  /** Every attempt failed for a reason that may pass, such as a network error. Try again later. */
  retry: { id: number; error: string }[]
  /** Tokens Expo says are no longer installed. Delete them. */
  deadTokens: string[]
}

/**
 * The key send-push uses to reach the database. Hosted projects on the new API keys provide
 * SUPABASE_SECRET_KEYS (a JSON object of named `sb_secret_` keys); older and local stacks provide
 * the legacy SUPABASE_SERVICE_ROLE_KEY.
 */
export function serviceKey(secretKeysJson?: string, legacyServiceRoleKey?: string): string {
  if (secretKeysJson) {
    try {
      const keys = JSON.parse(secretKeysJson) as Record<string, unknown>
      const key = keys.default ?? Object.values(keys)[0]
      if (typeof key === "string" && key) return key
    } catch {
      // Not JSON: fall back to the legacy key.
    }
  }
  return legacyServiceRoleKey ?? ""
}

// Expo accepts up to 100 messages per request.
export const EXPO_BATCH_SIZE = 100

export function buildMessages(rows: OutboxRow[]): { messages: ExpoMessage[]; owners: number[] } {
  const messages: ExpoMessage[] = []
  const owners: number[] = []
  for (const row of rows) {
    for (const token of row.tokens) {
      messages.push({
        to: token,
        title: row.title,
        body: row.body,
        sound: "default",
        data: { notificationId: row.id, gameId: row.game_id, kind: row.kind },
      })
      owners.push(row.id)
    }
  }
  return { messages, owners }
}

export function chunk<T>(items: T[], size = EXPO_BATCH_SIZE): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/**
 * Decide what happens to each outbox row given Expo's tickets. `tickets[i]` answers the message
 * sent to `messages[i]`, whose row is `owners[i]`.
 */
export function settle(
  rows: OutboxRow[],
  messages: ExpoMessage[],
  owners: number[],
  tickets: ExpoTicket[],
): Settlement {
  const results = new Map<number, { ok: number; dead: number; errors: string[] }>()
  for (const row of rows) results.set(row.id, { ok: 0, dead: 0, errors: [] })
  const deadTokens: string[] = []

  owners.forEach((owner, i) => {
    const result = results.get(owner)!
    const ticket = tickets[i] ?? { status: "error", message: "No ticket returned" }
    if (ticket.status === "ok") {
      result.ok++
    } else if (ticket.details?.error === "DeviceNotRegistered") {
      result.dead++
      deadTokens.push(messages[i].to)
    } else {
      result.errors.push(ticket.details?.error ?? ticket.message)
    }
  })

  const settlement: Settlement = { sent: [], retry: [], deadTokens }
  for (const row of rows) {
    const { ok, dead, errors } = results.get(row.id)!
    if (row.tokens.length === 0) {
      settlement.sent.push({ id: row.id, error: "No registered devices" })
    } else if (ok > 0) {
      settlement.sent.push({ id: row.id, error: errors[0] ?? null })
    } else if (errors.length === 0 && dead > 0) {
      settlement.sent.push({ id: row.id, error: "Every device was unregistered" })
    } else {
      settlement.retry.push({ id: row.id, error: errors[0] })
    }
  }
  return settlement
}
