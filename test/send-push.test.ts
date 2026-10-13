import {
  buildMessages,
  chunk,
  type ExpoTicket,
  type OutboxRow,
  serviceKey,
  settle,
} from "../supabase/functions/send-push/messages"

const row = (id: number, tokens: string[]): OutboxRow => ({
  id,
  user_id: `user-${id}`,
  game_id: 7,
  kind: "report_incoming",
  title: "You've been made",
  body: "Bob says you said a codeword. Confirm or dispute it.",
  tokens,
})

const ok: ExpoTicket = { status: "ok", id: "t" }
const dead: ExpoTicket = {
  status: "error",
  message: "not registered",
  details: { error: "DeviceNotRegistered" },
}
const limited: ExpoTicket = {
  status: "error",
  message: "slow down",
  details: { error: "MessageRateExceeded" },
}

describe("send-push messages", () => {
  it("sends one message per device and carries the game for deep links", () => {
    const { messages, owners } = buildMessages([row(1, ["a", "b"]), row(2, ["c"]), row(3, [])])
    expect(messages.map((m) => m.to)).toEqual(["a", "b", "c"])
    expect(owners).toEqual([1, 1, 2])
    expect(messages[0].data).toEqual({ notificationId: 1, gameId: 7, kind: "report_incoming" })
    expect(messages[0].sound).toBe("default")
  })

  it("splits requests into Expo-sized batches", () => {
    const batches = chunk(Array.from({ length: 250 }, (_, i) => i))
    expect(batches.map((b) => b.length)).toEqual([100, 100, 50])
  })

  it("settles each row from its tickets", () => {
    const rows = [
      row(1, ["a", "dead-b"]), // one device works, one is gone
      row(2, ["dead-c"]), // only device is gone
      row(3, ["d"]), // rate limited
      row(4, []), // no devices at all
    ]
    const { messages, owners } = buildMessages(rows)
    const result = settle(rows, messages, owners, [ok, dead, dead, limited])

    expect(result.sent).toEqual([
      { id: 1, error: null },
      { id: 2, error: "Every device was unregistered" },
      { id: 4, error: "No registered devices" },
    ])
    expect(result.retry).toEqual([{ id: 3, error: "MessageRateExceeded" }])
    expect(result.deadTokens).toEqual(["dead-b", "dead-c"])
  })

  it("retries when Expo returns fewer tickets than messages", () => {
    const rows = [row(1, ["a"])]
    const { messages, owners } = buildMessages(rows)
    expect(settle(rows, messages, owners, []).retry).toEqual([
      { id: 1, error: "No ticket returned" },
    ])
  })

  it("prefers the new secret key and falls back to the legacy one", () => {
    expect(serviceKey(JSON.stringify({ default: "sb_secret_a" }), "eyJ.legacy")).toBe("sb_secret_a")
    expect(serviceKey(JSON.stringify({ other: "sb_secret_b" }), "eyJ.legacy")).toBe("sb_secret_b")
    expect(serviceKey(undefined, "eyJ.legacy")).toBe("eyJ.legacy")
    expect(serviceKey("not json", "eyJ.legacy")).toBe("eyJ.legacy")
    expect(serviceKey(JSON.stringify({}), undefined)).toBe("")
  })
})
