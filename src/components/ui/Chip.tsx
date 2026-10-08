import { Pressable, StyleProp, TextStyle, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Text } from "../Text"

export interface ChipProps {
  label: string
  /**
   * Filled with ink, e.g. the active filter.
   */
  selected?: boolean
  /**
   * Dashed outline for an "add" affordance.
   */
  dashed?: boolean
  small?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * A mono uppercase tag: filters, codewords, and small actions like Copy and Share.
 */
export function Chip({ label, selected, dashed, small, onPress, style }: ChipProps) {
  const { themed } = useAppTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      style={({ pressed }) => [
        themed($chip),
        small && $small,
        selected && themed($selected),
        dashed && themed($dashed),
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text
        style={[
          themed($label),
          small && $smallLabel,
          selected && themed($selectedLabel),
          dashed && themed($dashedLabel),
        ]}
        text={label}
      />
    </Pressable>
  )
}

const $chip: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 32,
  paddingHorizontal: 12,
  alignSelf: "flex-start",
  justifyContent: "center",
  borderWidth: 1.5,
  borderColor: colors.ink,
  borderRadius: 3,
})

const $small: ViewStyle = { height: 30, paddingHorizontal: 10 }

const $selected: ThemedStyle<ViewStyle> = ({ colors }) => ({ backgroundColor: colors.ink })

const $dashed: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderStyle: "dashed",
  borderColor: colors.ink3,
})

const $label: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.medium,
  fontSize: 12,
  lineHeight: 15,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: colors.ink,
})

const $smallLabel: TextStyle = { fontSize: 11 }

const $selectedLabel: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.paper })

const $dashedLabel: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink2 })
