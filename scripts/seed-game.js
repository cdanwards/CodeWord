// Seed a sample game (remote or local) using the service role key
require("dotenv").config()

const { createClient } = require("@supabase/supabase-js")

async function ensureHostUser(supabase, email, name) {
  // Try to locate existing user by listing and filtering by email
  try {
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (listError) throw listError
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (existing) return existing
  } catch (err) {
    // fall through to creation
    console.error("Error listing users:", err)
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name },
  })
  if (error) throw error
  return data.user
}

function generateGameCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // avoid easily-confused chars
  let result = ""
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return result
}

async function main() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error("Missing env. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const hostEmail = process.env.SEED_HOST_EMAIL || "seed-host@example.com"
  const hostName = process.env.SEED_HOST_NAME || "Seed Host"

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  try {
    console.log("Ensuring host user...", hostEmail)
    const host = await ensureHostUser(supabase, hostEmail, hostName)
    console.log("Host user:", host.id)

    const code = process.env.SEED_GAME_CODE || generateGameCode(6)
    const name = process.env.SEED_GAME_NAME || "Seeded Codeword Game"
    const description = process.env.SEED_GAME_DESCRIPTION || "Development seed game"
    const durationHours = Number(process.env.SEED_GAME_DURATION_HOURS || 72)

    console.log("Creating game...", code)
    const { data: game, error: gameErr } = await supabase
      .from("games")
      .insert({
        name,
        description,
        code,
        host_user_id: host.id,
        status: "lobby",
        duration_hours: durationHours,
        settings: {},
      })
      .select()
      .single()

    if (gameErr) throw gameErr

    console.log("Game created:", game.id)

    console.log("Adding host membership (user_games)...")
    const { error: ugErr } = await supabase.from("user_games").insert({
      user_id: host.id,
      game_id: game.id,
      role: "host",
      status: "active",
      is_ready: false,
    })
    if (ugErr) throw ugErr

    const words = (process.env.SEED_WORDS || "puzzle,secret,whisper,shadow,signal").split(",")
    console.log(`Inserting ${words.length} game words...`)
    const payload = words.map((w, idx) => ({
      game_id: game.id,
      word: w.trim(),
      day_number: idx + 1,
    }))
    const { error: gwErr } = await supabase.from("game_words").insert(payload)
    if (gwErr) throw gwErr

    console.log("✅ Seed complete.")
    console.log("Code:", code)
  } catch (err) {
    console.error("💥 Seed failed:", err?.message || err)
    process.exit(1)
  }
}

main()
