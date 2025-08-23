import { ActivityIndicator } from "react-native"
import { Redirect, Stack } from "expo-router"

import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"

export default function AppLayout() {
  const { themed } = useAppTheme()
  const { isAuthenticated, isLoading } = useAuth()

  console.log("[(app) layout]", { isLoading, isAuthenticated })

  // Prefer rendering app if already authenticated, even while loading
  if (isAuthenticated) {
    return <Stack screenOptions={{ headerShown: false }} />
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
