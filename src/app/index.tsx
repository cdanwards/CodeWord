import { useEffect, useState } from "react"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { Redirect } from "expo-router"

export default function Index() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // TODO: Implement actual authentication check
    // For now, simulate checking auth status
    const checkAuth = async () => {
      try {
        // This is where you would check if user is logged in
        // For now, we'll assume user is not authenticated
        setIsAuthenticated(false)
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/home" />
  } else {
    return <Redirect href="/(auth)/login" />
  }
}
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
})
