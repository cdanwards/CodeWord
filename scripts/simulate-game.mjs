#!/usr/bin/env node
/**
 * Plays complete operations against the LOCAL Supabase stack with real signed-in agents and
 * checks the game engine rules (supabase/migrations/005_game_engine.sql) and permissions.
 *
 *   supabase start && node scripts/simulate-game.mjs
 *
 * Creates throwaway agents (agent-<run>-<n>@codeword.test) on every run. Uses the local
 * service-role key from `supabase status` only to fast-forward game clocks.
 */
import { execSync } from "node:child_process"
import assert from "node:assert/strict"
import { createClient } from "@supabase/supabase-js"

const status = Object.fromEntries(
  execSync("supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split("\n")
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
const URL = status.API_URL
const ANON = status.ANON_KEY
const SERVICE = status.SERVICE_ROLE_KEY
assert.ok(URL?.startsWith("http://127.0.0.1"), "Refusing to run against a non-local Supabase")

const PASSWORD = "codeword-dev-1"
const run = Date.now().toString(36)
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
let passed = 0

function check(name, fn) {
  return Promise.resolve(fn()).then(
    () => {
      passed += 1
      console.log(`  ok  ${name}`)
    },
    (error) => {
      console.error(`  FAIL ${name}\n       ${error.message}`)
      process.exitCode = 1
      throw error
    },
  )
}

async function agent(n, name) {
  const client = createClient(URL, ANON, { auth: { persistSession: false } })
  const email = `agent-${run}-${n}@codeword.test`
  const { data, error } = await client.auth.signUp({
    email,
    password: PASSWORD,
    options: { data: { name, full_name: name } },
  })
  if (error) throw error
  const id = data.user.id
  // Mirrors AuthProvider.ensureUserProfile, in case the signup trigger didn't set a name.
  await client.from("user_profiles").update({ full_name: name }).eq("user_id", id)
  return { client, id, name }
}

async function rpc(who, fn, args) {
  const { data, error } = await who.client.rpc(fn, args)
  if (error) throw new Error(`${who.name} ${fn}: ${error.message}`)
  return data
}

async function rpcFails(who, fn, args, pattern) {
  const { error } = await who.client.rpc(fn, args)
  assert.ok(error, `${who.name} ${fn} should have failed`)
  if (pattern) assert.match(error.message, pattern)
}

async function openOperation(host, players, durationHours = 72) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase()
  const { data: game, error } = await host.client
    .from("games")
    .insert({
      name: `Sim ${run}`,
      code,
      host_user_id: host.id,
      status: "lobby",
      duration_hours: durationHours,
    })
    .select()
    .single()
  if (error) throw error
  await host.client
    .from("user_games")
    .insert({ user_id: host.id, game_id: game.id, role: "host", status: "active" })
  for (const p of players) {
    const { error: joinError } = await p.client
      .from("user_games")
      .insert({ user_id: p.id, game_id: game.id })
    if (joinError) throw joinError
  }
  return game
}

async function confirmedKill(killer, everyone, gameId) {
  const mission = await rpc(killer, "my_mission", { p_game_id: gameId })
  const victim = everyone.find((a) => a.id === mission.target.user_id)
  await rpc(killer, "report_elimination", {
    p_game_id: gameId,
    p_word: mission.words[0].word,
    p_notes: "sim",
  })
  const incoming = (await rpc(victim, "my_mission", { p_game_id: gameId })).incoming
  await rpc(victim, "respond_to_elimination", {
    p_elimination_id: incoming.elimination_id,
    p_confirmed: true,
  })
  return victim
}

async function main() {
  console.log(`Simulating against ${URL} (run ${run})`)
  const host = await agent(1, "Alice Host")
  const bob = await agent(2, "Bob Martinez")
  const priya = await agent(3, "Priya Shah")
  const dev = await agent(4, "Dev Kumar")
  const everyone = [host, bob, priya, dev]

  console.log("\nLobby and start")
  const game = await openOperation(host, [bob, priya, dev])
  await check("members see the whole roster", async () => {
    const { data } = await bob.client.from("user_games").select("user_id").eq("game_id", game.id)
    assert.equal(data.length, 4)
  })
  await check("members see each other's names", async () => {
    const { data } = await bob.client
      .from("user_profiles")
      .select("full_name")
      .eq("user_id", priya.id)
    assert.equal(data[0]?.full_name, "Priya Shah")
  })
  await check("only the host can start", () =>
    rpcFails(bob, "start_game", { p_game_id: game.id }, /host/),
  )
  await check("host starts the operation", () => rpc(host, "start_game", { p_game_id: game.id }))
  await check("joining after the start is refused", async () => {
    const late = await agent(5, "Late Larry")
    const { error } = await late.client
      .from("user_games")
      .insert({ user_id: late.id, game_id: game.id })
    assert.ok(error, "late join should fail")
  })

  const missions = {}
  for (const a of everyone) missions[a.id] = await rpc(a, "my_mission", { p_game_id: game.id })

  await check("everyone has a target and one hard day-1 word", () => {
    for (const a of everyone) {
      const m = missions[a.id]
      assert.ok(m.target, `${a.name} has no target`)
      assert.equal(m.words.length, 1)
      assert.equal(m.words[0].difficulty, 1)
      assert.equal(m.agents_left, 4)
      assert.equal(m.game.day, 1)
    }
  })
  await check("targets form a single chain through every agent", () => {
    const seen = new Set()
    let current = host.id
    for (let i = 0; i < 4; i += 1) {
      seen.add(current)
      current = missions[current].target.user_id
    }
    assert.equal(current, host.id)
    assert.equal(seen.size, 4)
  })
  await check("agents can't read anyone else's words", async () => {
    const { data } = await bob.client.from("agent_words").select("user_id").eq("game_id", game.id)
    assert.ok(data.every((row) => row.user_id === bob.id))
  })
  await check("players can't read the target chain or kill records directly", async () => {
    for (const table of ["assignments", "eliminations", "elimination_confirmations"]) {
      const { data } = await bob.client.from(table).select("*").eq("game_id", game.id)
      assert.equal(data?.length ?? 0, 0, `${table} leaked ${data?.length} rows`)
    }
  })
  await check("the host can't rewrite the target chain", async () => {
    const { data } = await host.client
      .from("assignments")
      .update({ target_user_id: host.id })
      .eq("game_id", game.id)
      .select()
    assert.equal(data?.length ?? 0, 0)
  })
  await check("players can't revive themselves or leave mid-operation", async () => {
    const { data: updated } = await bob.client
      .from("user_games")
      .update({ status: "active" })
      .eq("game_id", game.id)
      .eq("user_id", bob.id)
      .select()
    assert.equal(updated?.length ?? 0, 0)
    const { data: deleted } = await bob.client
      .from("user_games")
      .delete()
      .eq("game_id", game.id)
      .eq("user_id", bob.id)
      .select()
    assert.equal(deleted?.length ?? 0, 0)
  })
  await check("the host can't change status or clocks directly", async () => {
    const { error } = await host.client.from("games").update({ status: "ended" }).eq("id", game.id)
    assert.ok(error, "status update should be refused")
    const { data } = await host.client
      .from("games")
      .update({ name: "Renamed" })
      .eq("id", game.id)
      .select()
    assert.equal(data?.length ?? 0, 0, "edits after the start should be refused")
  })
  await check("nobody can open a game that's already running", async () => {
    const { error } = await bob.client.from("games").insert({
      name: "Sneaky",
      code: "ZZZZZ9",
      host_user_id: bob.id,
      status: "active",
      duration_hours: 24,
    })
    assert.ok(error)
  })
  await check("signed-out callers can't use the engine", async () => {
    const anon = createClient(URL, ANON, { auth: { persistSession: false } })
    const { error } = await anon.rpc("my_mission", { p_game_id: game.id })
    assert.ok(error)
  })

  console.log("\nReporting, disputing, confirming")
  const hostMission = missions[host.id]
  const target = everyone.find((a) => a.id === hostMission.target.user_id)
  const targetsTarget = missions[target.id].target.user_id
  await check("a word you don't hold is refused", () =>
    rpcFails(host, "report_elimination", { p_game_id: game.id, p_word: "notmyword" }, /codewords/),
  )
  let reportId
  await check("reporting with your own word works", async () => {
    reportId = await rpc(host, "report_elimination", {
      p_game_id: game.id,
      p_word: hostMission.words[0].word,
    })
  })
  await check("one pending report at a time", () =>
    rpcFails(
      host,
      "report_elimination",
      { p_game_id: game.id, p_word: hostMission.words[0].word },
      /already/,
    ),
  )
  await check("the target sees the incoming report with the word", async () => {
    const m = await rpc(target, "my_mission", { p_game_id: game.id })
    assert.equal(m.incoming.elimination_id, reportId)
    assert.equal(m.incoming.word, hostMission.words[0].word.toLowerCase())
    assert.equal(m.incoming.killer_name, "Alice Host")
  })
  await check("only the target can answer", () => {
    const bystander = everyone.find((a) => a.id !== host.id && a.id !== target.id)
    return rpcFails(
      bystander,
      "respond_to_elimination",
      { p_elimination_id: reportId, p_confirmed: true },
      /not about you/,
    )
  })
  await check("a dispute voids the report", async () => {
    await rpc(target, "respond_to_elimination", {
      p_elimination_id: reportId,
      p_confirmed: false,
      p_note: "Nope",
    })
    const m = await rpc(host, "my_mission", { p_game_id: game.id })
    assert.equal(m.outgoing, null)
    assert.equal(m.target.user_id, target.id)
  })
  await check("confirming hands over the target and the words", async () => {
    reportId = await rpc(host, "report_elimination", {
      p_game_id: game.id,
      p_word: hostMission.words[0].word,
    })
    await rpc(target, "respond_to_elimination", { p_elimination_id: reportId, p_confirmed: true })
    const m = await rpc(host, "my_mission", { p_game_id: game.id })
    assert.equal(m.target.user_id, targetsTarget)
    assert.equal(m.words.length, 2)
    assert.equal(m.words.filter((w) => w.inherited_from_name === target.name).length, 1)
    assert.equal(m.agents_left, 3)
    const out = await rpc(target, "my_mission", { p_game_id: game.id })
    assert.equal(out.me.status, "eliminated")
    assert.equal(out.words.length, 0)
    assert.equal(out.eliminated_by.killer_name, "Alice Host")
  })
  await check("eliminated agents can't report", () =>
    rpcFails(target, "report_elimination", { p_game_id: game.id, p_word: "anything" }, /out/),
  )
  await check("the feed hides the word from bystanders", async () => {
    const bystander = everyone.find((a) => a.id !== host.id && a.id !== target.id)
    const theirs = await rpc(bystander, "game_board", { p_game_id: game.id })
    assert.equal(theirs.feed.length, 1)
    assert.equal(theirs.feed[0].word, null)
    const hostView = await rpc(host, "game_board", { p_game_id: game.id })
    assert.ok(hostView.feed[0].word)
    assert.equal(hostView.members.find((m) => m.user_id === host.id).eliminations, 1)
  })

  console.log("\nPlaying to the last agent")
  let remaining = everyone.filter((a) => a.id !== target.id)
  while (remaining.length > 1) {
    const killer = remaining[0]
    const victim = await confirmedKill(killer, everyone, game.id)
    remaining = remaining.filter((a) => a.id !== victim.id)
  }
  await check("the last agent standing wins and the game ends", async () => {
    const m = await rpc(remaining[0], "my_mission", { p_game_id: game.id })
    assert.equal(m.game.status, "ended")
    assert.equal(m.game.completion_reason, "last_agent_standing")
    assert.equal(m.winner.user_id, remaining[0].id)
    assert.equal(m.target, null)
    const { data } = await admin
      .from("game_results")
      .select("total_eliminations")
      .eq("game_id", game.id)
      .single()
    assert.equal(data.total_eliminations, 3)
  })

  console.log("\nDaily words and the clock")
  const timed = await openOperation(host, [bob, priya], 72)
  await rpc(host, "start_game", { p_game_id: timed.id })
  const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString()
  await check("day 2 issues a second, medium word", async () => {
    await admin
      .from("games")
      .update({ started_at: hoursAgo(25) })
      .eq("id", timed.id)
    const m = await rpc(bob, "my_mission", { p_game_id: timed.id })
    assert.equal(m.game.day, 2)
    assert.deepEqual(m.words.map((w) => w.difficulty).sort(), [1, 2])
  })
  await check("day 3 issues an easy word", async () => {
    await admin
      .from("games")
      .update({ started_at: hoursAgo(49) })
      .eq("id", timed.id)
    const m = await rpc(priya, "my_mission", { p_game_id: timed.id })
    assert.deepEqual(m.words.map((w) => w.difficulty).sort(), [1, 2, 3])
  })
  await check("words are never issued twice in one game", async () => {
    const { data } = await admin.from("agent_words").select("word").eq("game_id", timed.id)
    assert.equal(new Set(data.map((r) => r.word)).size, data.length)
  })
  await check("time running out ends the operation", async () => {
    await admin
      .from("games")
      .update({ started_at: hoursAgo(73) })
      .eq("id", timed.id)
    const m = await rpc(host, "my_mission", { p_game_id: timed.id })
    assert.equal(m.game.status, "ended")
    assert.equal(m.game.completion_reason, "time_up")
  })
  await check("only the host can end early", async () => {
    const early = await openOperation(host, [bob])
    await rpc(host, "start_game", { p_game_id: early.id })
    await rpcFails(bob, "end_game", { p_game_id: early.id }, /host/)
    await rpc(host, "end_game", { p_game_id: early.id })
  })

  console.log(`\n${passed} checks passed`)
}

main().catch((error) => {
  if (!process.exitCode) {
    console.error(error)
    process.exitCode = 1
  }
})
