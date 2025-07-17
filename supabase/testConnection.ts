import { testConnection } from "./database"

// Test the database connection
export async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...")
  const success = await testConnection()

  if (success) {
    console.log("🎉 Database connection is working!")
  } else {
    console.log("💥 Database connection failed!")
  }

  return success
}
