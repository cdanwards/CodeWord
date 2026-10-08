import { StyleProp, TextStyle, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Text } from "../Text"

export type StampTone = "red" | "ink" | "mute"

export interface StampProps {
  text: string
  tone?: StampTone
  /**
   * "lg" is the full-width "Eliminated" stamp.
   */
  size?: "sm" | "lg"
  /**
   * Rotation in degrees. Defaults depend on tone and size so stamps look hand-applied.
   */
  rotate?: number
  style?: StyleProp<ViewStyle>
}

/**
 * A rubber stamp: bordered, rotated, uppercase. Used for game status and outcomes.
 */
export function Stamp({ text, tone = "red", size = "sm", rotate, style }: StampProps) {
  const { themed, theme } = useAppTheme()
  const color = { red: theme.colors.red, ink: theme.colors.ink, mute: theme.colors.ink3 }[tone]
  const deg = rotate ?? (tone === "mute" ? 3 : size === "lg" ? -12 : -5)

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={text}
      style={[
        themed($frame[size]),
        { borderColor: color, transform: [{ rotate: `${deg}deg` }] },
        style,
      ]}
    >
      <Text style={[themed($label[size]), { color }]} text={text} />
    </View>
  )
}

const $frame: Record<NonNullable<StampProps["size"]>, ThemedStyle<ViewStyle>> = {
  sm: () => ({
    alignSelf: "flex-start",
    borderWidth: 2.5,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingTop: 3,
    paddingBottom: 2,
    opacity: 0.92,
  }),
  lg: () => ({
    alignSelf: "flex-start",
    borderWidth: 6,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
    opacity: 0.92,
  }),
}

const $label: Record<NonNullable<StampProps["size"]>, ThemedStyle<TextStyle>> = {
  sm: ({ typography }) => ({
    fontFamily: typography.display.extraBold,
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  }),
  lg: ({ typography }) => ({
    fontFamily: typography.display.extraBold,
    fontSize: 50,
    lineHeight: 52,
    letterSpacing: 2,
    textTransform: "uppercase",
  }),
}
