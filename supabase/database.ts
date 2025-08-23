import "react-native-url-polyfill/auto"
import Constants from "expo-constants"
import * as SecureStore from "expo-secure-store"
import { createClient } from "@supabase/supabase-js"

// Get environment variables from Expo Constants with fallback to process.env
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.SUPABASE_URL
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY

console.log("🔧 Supabase Config Debug:")
console.log(
  "- Constants.expoConfig?.extra?.supabaseUrl:",
  !!Constants.expoConfig?.extra?.supabaseUrl,
)
console.log(
  "- Constants.expoConfig?.extra?.supabaseAnonKey:",
  !!Constants.expoConfig?.extra?.supabaseAnonKey,
)
console.log("- process.env.SUPABASE_URL:", !!process.env.SUPABASE_URL)
console.log("- process.env.SUPABASE_ANON_KEY:", !!process.env.SUPABASE_ANON_KEY)
console.log("- Final supabaseUrl:", !!supabaseUrl)
console.log("- Final supabaseAnonKey:", !!supabaseAnonKey)

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not defined. Check your .env file and app.config.ts")
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_ANON_KEY is not defined. Check your .env file and app.config.ts")
}

// Storage adapter for React Native using Expo Secure Store
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Re-export config for consumers that need raw values (e.g., network checks)
export const SUPABASE_URL = supabaseUrl
export const SUPABASE_ANON_KEY = supabaseAnonKey

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
