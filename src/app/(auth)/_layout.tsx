import { ActivityIndicator } from "react-native"
import { Redirect, Stack } from "expo-router"

import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"

export default function AuthLayout() {
  const {
    theme: { colors },
  } = useAppTheme()
  const { isAuthenticated, isLoading } = useAuth()

  console.log("[(auth) layout]", { isLoading, isAuthenticated })

  if (isAuthenticated) return <Redirect href="/(app)/(tabs)/home" />
  if (isLoading)
    return (
      <ActivityIndicator
        size="large"
        color={colors.red}
        style={[$spinner, { backgroundColor: colors.paper }]}
      />
    )

  console.log("[(auth) layout]", { isLoading, isAuthenticated })

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}

const $spinner = { flex: 1 }
