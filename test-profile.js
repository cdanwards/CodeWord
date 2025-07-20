const { useAuthStore } = require("./src/stores/authStore")

async function testProfile() {
  try {
    console.log("Testing Profile Screen with Auth Store...")

    // Set up a mock user
    const mockUser = {
      id: "test-user-123",
      email: "john.doe@example.com",
      name: "John Doe",
      image: null,
      emailVerified: true,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-07-20"),
    }

    // Set the user in the store
    useAuthStore.getState().setUser(mockUser)

    // Verify the state
    const state = useAuthStore.getState()
    console.log("Auth state after setting user:", {
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
    })

    // Test user data extraction
    const user = state.user
    if (user) {
      console.log("User data for profile screen:")
      console.log("- Name:", user.name)
      console.log("- Email:", user.email)
      console.log("- Username:", user.email.split("@")[0])
      console.log(
        "- Initials:",
        user.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      )
      console.log("- Email Verified:", user.emailVerified)
      console.log("- Member Since:", new Date(user.createdAt).toLocaleDateString())
      console.log("- Last Updated:", new Date(user.updatedAt).toLocaleDateString())
    }

    console.log("✅ Profile screen test successful")
  } catch (error) {
    console.error("❌ Profile screen test failed:", error)
  }
}

testProfile()
