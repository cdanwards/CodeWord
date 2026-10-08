import { ActivityIndicator } from "react-native"
import { Redirect, Stack } from "expo-router"

import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"

export default function AppLayout() {
  const {
    theme: { colors },
  } = useAppTheme()
  const { isAuthenticated, isLoading } = useAuth()

  console.log("[(app) layout]", { isLoading, isAuthenticated })

  // Prefer rendering app if already authenticated, even while loading
  if (isAuthenticated) {
    return (
      // Screens draw their own dossier TopBar.
      <Stack screenOptions={{ headerShown: false }} />
    )
  }

  if (isLoading)
    return (
      <ActivityIndicator
        size="large"
        color={colors.red}
        style={[$spinner, { backgroundColor: colors.paper }]}
      />
    )
  return <Redirect href="/(auth)/login" />
}

const $spinner = { flex: 1 }
