import { ActivityIndicator } from "react-native"
import { Redirect, Tabs } from "expo-router"

import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"

export default function AppLayout() {
  const { themed } = useAppTheme()
  const { isAuthenticated, isLoading } = useAuth()

  console.log("[(app) layout]", { isLoading, isAuthenticated })

  // Prefer rendering app if already authenticated, even while loading
  if (isAuthenticated) {
    return (
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="games" options={{ title: "Games" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    )
  }

  if (isLoading)
    return (
      <ActivityIndicator
        size="large"
        color={themed({ colors: { primary: "red" } }).colors.primary}
      />
    )
  return <Redirect href="/(auth)/login" />
}
