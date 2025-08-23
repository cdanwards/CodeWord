import { ActivityIndicator } from "react-native"
import { Redirect, Stack } from "expo-router"

import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"

export default function AuthLayout() {
  const { themed } = useAppTheme()
  const { isAuthenticated, isLoading } = useAuth()

  console.log("[(auth) layout]", { isLoading, isAuthenticated })

  if (isAuthenticated) return <Redirect href="/(app)/(tabs)/home" />
  if (isLoading)
    return (
      <ActivityIndicator
        size="large"
        color={themed({ colors: { primary: "red" } }).colors.primary}
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
