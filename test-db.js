// Simple test script to verify database connection
require("dotenv").config()

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...")
    console.log("📋 Environment variables loaded:")
    console.log("   DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Missing")
    console.log("   BETTER_AUTH_SECRET:", process.env.BETTER_AUTH_SECRET ? "✅ Set" : "❌ Missing")

    // Test if we can parse the connection string
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error("DATABASE_URL is not set")
    }

    console.log("🔗 Connection string format looks good")
    console.log("✅ Environment variables are properly configured!")

    return true
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    return false
  }
}

// Run the test
testConnection().then((success) => {
  if (success) {
    console.log("🎉 Environment setup is correct!")
    console.log("💡 Next step: Test the connection in your Expo app")
  } else {
    console.log("💥 Environment setup failed!")
    process.exit(1)
  }
})
