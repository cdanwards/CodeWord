import Constants from "expo-constants"
import { createClient } from "@supabase/supabase-js"

// Get environment variables from Expo Constants with fallback to process.env
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.SUPABASE_URL
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not defined. Check your .env file and app.config.ts")
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_ANON_KEY is not defined. Check your .env file and app.config.ts")
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Test connection function
export async function testConnection() {
  try {
    const { error } = await supabase.from("_dummy_table_for_test").select("*").limit(1)

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "relation does not exist" which is expected for a dummy table
      throw error
    }

    console.log("✅ Supabase connection successful")
    return true
  } catch (error) {
    console.error("❌ Supabase connection failed:", error)
    return false
  }
}
