import { ReactNode } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Text } from "../Text"

export interface TopBarProps {
  /**
   * "back" shows ←, "close" shows ×. Both call `onLeftPress`, or `router.back()` by default.
   */
  left?: "back" | "close" | ReactNode
  onLeftPress?: () => void
  /**
   * Mono file label on the right, e.g. "Form 27-B · Recruitment".
   */
  label?: string
  /**
   * Anything else on the right (a stamp, a link). Shown after `label`.
   */
  right?: ReactNode
  night?: boolean
}

/**
 * The dossier screen header: a back/close mark on the left and a file label on the right.
 */
export function TopBar({ left, onLeftPress, label, right, night }: TopBarProps) {
  const router = useRouter()
  const { themed, theme } = useAppTheme()
  const color = night ? theme.colors.onNight : theme.colors.ink
  const goBack = onLeftPress ?? (() => router.back())

  let leftNode: ReactNode = left
  if (left === "back" || left === "close") {
    leftNode = (
      <Pressable
        onPress={goBack}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={left === "back" ? "Back" : "Close"}
      >
        <Text style={[themed($mark), { color }]} text={left === "back" ? "←" : "×"} />
      </Pressable>
    )
  }

  return (
    <View style={$bar}>
      <View>{leftNode}</View>
      <View style={$right}>
        {!!label && (
          <Text
            preset="label"
            text={label}
            style={night ? { color: theme.colors.onNight2 } : undefined}
            numberOfLines={1}
          />
        )}
        {right}
      </View>
    </View>
  )
}

const $bar: ViewStyle = {
  height: 44,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
}

const $right: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  flexShrink: 1,
}

const $mark: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontFamily: typography.mono.medium,
  fontSize: 22,
  lineHeight: 26,
})
