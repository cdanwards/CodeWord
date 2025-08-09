import { useEffect } from "react"
import { View, ViewStyle } from "react-native"
import { usePathname } from "expo-router"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export function RouteBanner() {
  const pathname = usePathname()
  const { themed } = useAppTheme()

  useEffect(() => {
    console.log("[Route]", pathname)
  }, [pathname])

  return (
    <View style={themed($container)}>
      <Text preset="formHelper" text={`Route: ${pathname}`} />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  width: "100%",
})
