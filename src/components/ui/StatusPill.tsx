import { Text, View } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export type StatusVariant = "waiting" | "active" | "ended"

export interface StatusPillProps {
  variant: StatusVariant
  label?: string
}

export function StatusPill({ variant, label }: StatusPillProps) {
  const { themed } = useAppTheme()

  return (
    <View style={themed(($container as any)(variant))} accessibilityRole="text">
      <Text style={themed(($text as any)(variant))}>{label ?? labelByVariant[variant]}</Text>
    </View>
  )
}

const labelByVariant: Record<StatusVariant, string> = {
  waiting: "Waiting",
  active: "Active",
  ended: "Ended",
}

const $container: (v: StatusVariant) => ThemedStyle<any> =
  (v) =>
  ({ colors, radii, spacing, borderWidth }) => ({
    borderRadius: radii.md,
    paddingVertical: spacing.xxxs,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.status[v].bg,
    borderWidth: borderWidth.thin,
    borderColor: colors.separator,
  })

const $text: (v: StatusVariant) => ThemedStyle<any> =
  (v) =>
  ({ colors, typography }) => ({
    color: colors.status[v].text,
    fontFamily: typography.primary.medium,
    fontSize: 12,
    lineHeight: 16,
  })
