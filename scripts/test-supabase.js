// Test Supabase connectivity from Node (no Expo dependencies)
require("dotenv").config()

const { createClient } = require("@supabase/supabase-js")

async function main() {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY

  console.log("🔍 Testing Supabase connection...")
  console.log("   SUPABASE_URL:", url ? "✅ Set" : "❌ Missing")
  console.log("   SUPABASE_ANON_KEY:", anonKey ? "✅ Set" : "❌ Missing")

  if (!url || !anonKey) {
    process.exitCode = 1
    return
  }

  try {
    const supabase = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    // Simple network/auth endpoint reachability
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.log("⚠️ auth.getSession error (expected if not signed in):", sessionError.message)
    } else {
      console.log(
        "✅ auth.getSession reachable; session:",
        sessionData?.session ? "present" : "none",
      )
    }

    // Public read test on `games` (RLS policy allows public SELECT per migration)
    const { error: gamesError, count } = await supabase
      .from("games")
      .select("*", { count: "exact", head: true })

    if (gamesError) {
      console.log("❌ SELECT games failed:", gamesError.message)
      process.exitCode = 1
    } else {
      console.log("✅ SELECT games succeeded; rows:", typeof count === "number" ? count : "unknown")
    }
  } catch (err) {
    console.error("💥 Connection test failed:", err?.message || err)
    process.exitCode = 1
  }
}

main()
