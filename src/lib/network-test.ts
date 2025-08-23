import { networkManager } from "./network-utils"
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "../../supabase/database"

export async function runNetworkTests() {
  console.log("🧪 Running network connectivity tests...")

  // Test 1: Basic network status
  const status = networkManager.getStatus()
  console.log("📊 Network Status:", status)

  // Test 2: Supabase connectivity check
  const canReachSupabase = await networkManager.checkSupabaseConnectivity()
  console.log("🔗 Can reach Supabase:", canReachSupabase)

  // Test 3: Direct fetch test
  try {
    console.log("🌐 Testing direct fetch to Supabase with timeout...")
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    console.log("✅ Direct fetch status:", response.status, response.statusText)
  } catch (error) {
    console.log("❌ Direct fetch failed:", error)
  }

  // Test 4: Auth session test
  try {
    console.log("🔐 Testing auth session...")
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.log("❌ Auth session error:", error)
    } else {
      console.log("✅ Auth session check successful:", !!data.session)
    }
  } catch (error) {
    console.log("❌ Auth session test failed:", error)
  }

  return {
    networkStatus: status,
    canReachSupabase,
  }
}
