#!/usr/bin/env node
/**
 * Play as a local test agent from the terminal, so one person can test a multiplayer game.
 * LOCAL Supabase only (`supabase start`). Accounts are created on first use.
 *
 *   node scripts/agent.mjs <agent> create "<name>" [hours]   # opens a lobby, prints the code
 *   node scripts/agent.mjs <agent> join <CODE>
 *   node scripts/agent.mjs <agent> mission <CODE>          # target, words, pending reports
 *   node scripts/agent.mjs <agent> report <CODE> [word]    # defaults to your first word
 *   node scripts/agent.mjs <agent> confirm <CODE>          # confirm the report against you
 *   node scripts/agent.mjs <agent> dispute <CODE> [reason]
 *   node scripts/agent.mjs <agent> start <CODE>            # host only
 *
 * <agent> is one of: alice, bob, priya, dev. All use the password codeword-dev-1.
 */
import { execSync } from "node:child_process"
import { createClient } from "@supabase/supabase-js"

const AGENTS = {
  alice: "Alice Tester",
  bob: "Bob Martinez",
  priya: "Priya Shah",
  dev: "Dev Kumar",
}
const PASSWORD = "codeword-dev-1"

const [agentKey, command, code, ...rest] = process.argv.slice(2)
if (!AGENTS[agentKey] || !command) {
  console.error("usage: node scripts/agent.mjs <alice|bob|priya|dev> <command> [CODE] [...]")
  process.exit(1)
}

const env = Object.fromEntries(
  execSync("supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split("\n")
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
if (!env.API_URL?.startsWith("http://127.0.0.1")) {
  console.error("Local Supabase isn't running (supabase start).")
  process.exit(1)
}

const client = createClient(env.API_URL, env.ANON_KEY, { auth: { persistSession: false } })

async function signIn() {
  const email = `${agentKey}@codeword.test`
  const name = AGENTS[agentKey]
  let { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) {
    ;({ data, error } = await client.auth.signUp({
      email,
      password: PASSWORD,
      options: { data: { name, full_name: name } },
    }))
    if (error) throw error
    await client.from("user_profiles").update({ full_name: name }).eq("user_id", data.user.id)
    console.log(`Created ${email}`)
  }
  return data.user
}

async function gameId() {
  if (!code) throw new Error("Pass the game code, e.g. FK8NLT")
  const { data, error } = await client.from("games").select("id, name").eq("code", code.toUpperCase()).maybeSingle()
  if (error || !data) throw new Error(`No game with code ${code}`)
  return data.id
}

async function rpc(fn, args) {
  const { data, error } = await client.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data
}

async function main() {
  const user = await signIn()
  const name = AGENTS[agentKey]

  if (command === "create") {
    const gameName = code ?? "Test Operation"
    const newCode = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("")
    const { data: game, error } = await client
      .from("games")
      .insert({ name: gameName, code: newCode, host_user_id: user.id, status: "lobby", duration_hours: Number(rest[0] ?? 72) })
      .select()
      .single()
    if (error) throw new Error(error.message)
    await client.from("user_games").insert({ user_id: user.id, game_id: game.id, role: "host", status: "active" })
    console.log(`${name} opened "${gameName}" · code ${newCode}`)
    return
  }

  if (command === "join") {
    const id = await gameId()
    const { error } = await client.from("user_games").insert({ user_id: user.id, game_id: id })
    if (error) throw new Error(error.message)
    console.log(`${name} joined ${code}`)
    return
  }

  const id = await gameId()
  if (command === "start") {
    await rpc("start_game", { p_game_id: id })
    console.log(`${name} started ${code}`)
    return
  }

  const mission = await rpc("my_mission", { p_game_id: id })
  if (command === "mission") {
    const { game, me, target, words, incoming, outgoing } = mission
    console.log(`${name} · ${game.name} (${game.status}, day ${game.day}/${game.days_total}) · ${me.status}`)
    console.log(`  target:   ${target ? target.full_name : "none"}`)
    console.log(`  words:    ${words.map((w) => w.word).join(", ") || "none"}`)
    if (incoming) console.log(`  incoming: ${incoming.killer_name} says you said "${incoming.word}"`)
    if (outgoing) console.log(`  outgoing: waiting for ${outgoing.victim_name} ("${outgoing.word}")`)
    return
  }
  if (command === "report") {
    const word = rest[0] ?? mission.words[0]?.word
    await rpc("report_elimination", { p_game_id: id, p_word: word, p_notes: rest.slice(1).join(" ") || null })
    console.log(`${name} reported ${mission.target?.full_name} with "${word}"`)
    return
  }
  if (command === "confirm" || command === "dispute") {
    if (!mission.incoming) throw new Error(`${name} has no report waiting`)
    await rpc("respond_to_elimination", {
      p_elimination_id: mission.incoming.elimination_id,
      p_confirmed: command === "confirm",
      p_note: rest.join(" ") || null,
    })
    console.log(`${name} ${command === "confirm" ? "confirmed" : "disputed"} ${mission.incoming.killer_name}'s report`)
    return
  }
  throw new Error(`Unknown command ${command}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
