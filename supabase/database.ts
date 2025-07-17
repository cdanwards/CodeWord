import Constants from "expo-constants"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

// Get environment variables from Expo Constants with fallback to process.env
const databaseUrl = Constants.expoConfig?.extra?.databaseUrl || process.env.DATABASE_URL
const betterAuthSecret =
  Constants.expoConfig?.extra?.betterAuthSecret || process.env.BETTER_AUTH_SECRET

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined. Check your .env file and app.config.ts")
}

if (!betterAuthSecret) {
  throw new Error("BETTER_AUTH_SECRET is not defined. Check your .env file and app.config.ts")
}

export const client = postgres(databaseUrl, {
  prepare: false,
  max: 10, // Connection pool size
  idle_timeout: 20, // Close idle connections after 20 seconds
})
export const db = drizzle(client, { schema })

// Export the secret for Better-Auth
export const authSecret = betterAuthSecret

// Test connection function
export async function testConnection() {
  try {
    const result = await db.execute("SELECT NOW() as current_time")
    console.log("✅ Database connection successful:", result)
    return true
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    return false
  }
}
