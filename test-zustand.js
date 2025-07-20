const { useAuthStore } = require("./src/stores/authStore")

async function testZustand() {
  try {
    console.log("Testing Zustand auth store...")

    // Test initial state
    const initialState = useAuthStore.getState()
    console.log("Initial state:", {
      user: initialState.user,
      isAuthenticated: initialState.isAuthenticated,
      isLoading: initialState.isLoading,
      error: initialState.error,
    })

    // Test state setters
    useAuthStore.getState().setUser({
      id: "test-user",
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const updatedState = useAuthStore.getState()
    console.log("Updated state:", {
      user: updatedState.user,
      isAuthenticated: updatedState.isAuthenticated,
    })

    console.log("✅ Zustand store test successful")
  } catch (error) {
    console.error("❌ Zustand store test failed:", error)
  }
}

testZustand()
