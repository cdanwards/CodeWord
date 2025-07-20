import { useEffect } from "react"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { Redirect } from "expo-router"

import { useAuth } from "@/stores"

export default function Index() {
  const { isAuthenticated, isLoading, checkAuth } = useAuth()

  useEffect(() => {
    // Check authentication status when the app starts
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Redirect based on authentication status from Zustand store
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
