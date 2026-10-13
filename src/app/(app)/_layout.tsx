import { ActivityIndicator } from "react-native"
import { Redirect, Stack } from "expo-router"

import { usePushNotifications } from "@/lib/notifications"
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
      <>
        <PushNotifications />
        {/* Screens draw their own dossier TopBar. */}
        <Stack screenOptions={{ headerShown: false }} />
      </>
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

/** Keeps this device registered for pushes and opens the game a tapped push is about. */
function PushNotifications() {
  usePushNotifications()
  return null
}

const $spinner = { flex: 1 }
