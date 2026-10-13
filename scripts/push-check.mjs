#!/usr/bin/env node
/**
 * Checks push delivery end to end against the LOCAL Supabase stack: a game event queues a
 * notification, the database calls the send-push Edge Function, and the function posts to a
 * stand-in for Expo's push service that this script runs on port 4599.
 *
 *   cp supabase/functions/.env.example supabase/functions/.env   # once, then `supabase start`
 *   node scripts/push-check.mjs            # run the checks
 *   node scripts/push-check.mjs --listen   # just print every push the function sends
 *
 * The function only uses the stand-in when supabase/functions/.env sets
 * EXPO_PUSH_URL=http://host.docker.internal:4599/push. Tokens containing "dead" get Expo's
 * DeviceNotRegistered answer; every other token is accepted.
 */
import { execSync } from "node:child_process"
import assert from "node:assert/strict"
import http from "node:http"
import { createClient } from "@supabase/supabase-js"

const PORT = 4599
const LISTEN_ONLY = process.argv.includes("--listen")

// Every message the stand-in received, in order.
const received = []

const server = http.createServer((req, res) => {
  let raw = ""
  req.on("data", (chunk) => (raw += chunk))
  req.on("end", () => {
    const messages = JSON.parse(raw || "[]")
    const data = messages.map((m) => {
      received.push(m)
      if (LISTEN_ONLY) console.log(`${m.to}\n  ${m.title}: ${m.body}\n  ${JSON.stringify(m.data)}`)
      return m.to.includes("dead")
        ? {
            status: "error",
            message: `"${m.to}" is not a registered push notification recipient`,
            details: { error: "DeviceNotRegistered" },
          }
        : { status: "ok", id: `ticket-${received.length}` }
    })
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ data }))
  })
})

await new Promise((resolve) => server.listen(PORT, "::", resolve))

if (LISTEN_ONLY) {
  console.log(`Printing pushes sent to http://host.docker.internal:${PORT}/push (Ctrl-C to stop)`)
} else {
  await main()
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
    .finally(() => server.close())
}

async function main() {
  const status = Object.fromEntries(
    execSync("supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split("\n")
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  )
  const URL = status.API_URL
  const ANON = status.ANON_KEY
  assert.ok(URL?.startsWith("http://127.0.0.1"), "Refusing to run against a non-local Supabase")
  const admin = createClient(URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const run = Date.now().toString(36)
  let passed = 0

  async function check(name, fn) {
    try {
      await fn()
      passed += 1
      console.log(`  ok  ${name}`)
    } catch (error) {
      console.error(`  FAIL ${name}\n       ${error.message}`)
      throw error
    }
  }

  async function agent(n, name) {
    const client = createClient(URL, ANON, { auth: { persistSession: false } })
    const { data, error } = await client.auth.signUp({
      email: `push-${run}-${n}@codeword.test`,
      password: "codeword-dev-1",
      options: { data: { name, full_name: name } },
    })
    if (error) throw error
    await client.from("user_profiles").update({ full_name: name }).eq("user_id", data.user.id)
    return { client, id: data.user.id, name }
  }

  async function rpc(who, fn, args) {
    const { data, error } = await who.client.rpc(fn, args)
    if (error) throw new Error(`${who.name} ${fn}: ${error.message}`)
    return data
  }

  /** Wait until the stand-in has received a message to `token`, and return it. */
  async function pushTo(token, title, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const hit = received.find((m) => m.to === token && m.title === title)
      if (hit) return hit
      await new Promise((r) => setTimeout(r, 250))
    }
    throw new Error(
      `No "${title}" push reached ${token} within ${timeoutMs / 1000}s. Is EXPO_PUSH_URL in ` +
        `supabase/functions/.env pointing at http://host.docker.internal:${PORT}/push, and was ` +
        "the stack restarted after setting it?",
    )
  }

  /** Retry an assertion for a few seconds: the function updates rows after Expo answers. */
  async function eventually(fn, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs
    for (;;) {
      try {
        return await fn()
      } catch (error) {
        if (Date.now() > deadline) throw error
        await new Promise((r) => setTimeout(r, 250))
      }
    }
  }

  console.log(`Checking push delivery against ${URL} (run ${run})`)
  const host = await agent(1, "Hana Host")
  const bob = await agent(2, "Bob Martinez")
  const hostToken = `ExponentPushToken[push-${run}-host]`
  const bobToken = `ExponentPushToken[push-${run}-bob]`
  const deadToken = `ExponentPushToken[dead-${run}-bob]`
  await rpc(host, "register_push_token", { p_token: hostToken, p_platform: "ios" })
  await rpc(bob, "register_push_token", { p_token: bobToken, p_platform: "ios" })
  await rpc(bob, "register_push_token", { p_token: deadToken, p_platform: "android" })

  const { data: game, error } = await host.client
    .from("games")
    .insert({
      name: `Push ${run}`,
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
      host_user_id: host.id,
      status: "lobby",
      duration_hours: 24,
    })
    .select()
    .single()
  if (error) throw error
  await host.client
    .from("user_games")
    .insert({ user_id: host.id, game_id: game.id, role: "host", status: "active" })
  await bob.client.from("user_games").insert({ user_id: bob.id, game_id: game.id })

  await check("a recruit joining pushes to the host's device", async () => {
    const push = await pushTo(hostToken, "New recruit")
    assert.equal(push.body, `Bob Martinez joined Push ${run}.`)
    assert.equal(push.sound, "default")
    assert.equal(push.data.gameId, game.id)
    assert.equal(push.data.kind, "agent_joined")
  })

  await rpc(host, "start_game", { p_game_id: game.id })
  await check("the start pushes to every device the agent has", async () => {
    await pushTo(bobToken, "Operation live")
    await pushTo(deadToken, "Operation live")
    assert.ok(!received.some((m) => m.to === hostToken && m.title === "Operation live"))
  })

  await check("delivered rows are marked sent", () =>
    eventually(async () => {
      const { data } = await admin
        .from("notifications")
        .select("kind, sent_at, last_error")
        .eq("game_id", game.id)
      assert.equal(data.length, 2)
      assert.ok(data.every((r) => r.sent_at && r.last_error === null))
    }),
  )

  await check("tokens Expo no longer knows are removed", () =>
    eventually(async () => {
      const { data } = await admin.from("push_tokens").select("token").eq("user_id", bob.id)
      assert.deepEqual(
        data.map((r) => r.token),
        [bobToken],
      )
    }),
  )

  await check("the function refuses anyone without the service role key", async () => {
    const response = await fetch(`${URL}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${ANON}`, "Content-Type": "application/json" },
      body: "{}",
    })
    assert.equal(response.status, 403)
  })

  console.log(`\n${passed} checks passed`)
}
