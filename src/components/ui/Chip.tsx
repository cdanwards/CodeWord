import { View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Text } from "../Text"

export interface ChipProps {
  label: string
  tone?: "neutral" | "info" | "success" | "warning"
}

export function Chip({ label, tone = "neutral" }: ChipProps) {
  const { themed } = useAppTheme()
  return (
    <View style={themed($container(tone))} accessibilityRole="text">
      <Text preset="meta" style={themed($text(tone))}>
        {label}
      </Text>
    </View>
  )
}

const $container: (t: NonNullable<ChipProps["tone"]>) => ThemedStyle<ViewStyle> =
  (t) =>
  ({ colors, spacing, radii, borderWidth }) => {
    const map = {
      neutral: { bg: colors.palette.neutral200, border: colors.separator },
      info: { bg: colors.infoBackground, border: colors.info },
      success: { bg: colors.successBackground, border: colors.success },
      warning: { bg: colors.warningBackground, border: colors.warning },
    } as const
    return {
      paddingVertical: spacing.xxxs,
      paddingHorizontal: spacing.xs,
      borderRadius: radii.md,
      backgroundColor: map[t].bg,
      borderWidth: borderWidth.thin,
      borderColor: map[t].border,
    }
  }

const $text: (t: NonNullable<ChipProps["tone"]>) => ThemedStyle<any> =
  (t) =>
  ({ colors }) => {
    const map = {
      neutral: colors.textDim,
      info: colors.info,
      success: colors.success,
      warning: colors.warning,
    } as const
    return { color: map[t] }
  }
