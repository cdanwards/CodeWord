const { auth } = require("./src/lib/auth.ts")

async function testAuth() {
  try {
    console.log("Testing Better Auth configuration...")

    // Test database connection
    console.log("Database connection successful")

    // Test signup
    const signupResult = await auth.api.signUpEmail({
      body: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    })

    console.log("Signup test successful:", signupResult)
  } catch (error) {
    console.error("Auth test failed:", error)
  }
}

testAuth()
