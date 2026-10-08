import { Pressable, TextStyle, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Text } from "../Text"

export interface SegmentedOption<T> {
  label: string
  value: T
}

export interface SegmentedProps<T> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * A row of joined choices; the selected one is filled with ink.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const { themed } = useAppTheme()
  return (
    <View style={themed($row)} accessibilityRole="radiogroup">
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[$segment, index > 0 && themed($divider), selected && themed($segmentOn)]}
          >
            <Text style={[themed($label), selected && themed($labelOn)]} text={option.label} />
          </Pressable>
        )
      })}
    </View>
  )
}

// One rounded outer border with plain dividers: per-segment radii and borders render with
// artifacts on iOS where they meet.
const $row: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  borderWidth: 1.5,
  borderColor: colors.ink,
  borderRadius: 4,
  overflow: "hidden",
})

const $segment: ViewStyle = {
  flex: 1,
  height: 41,
  alignItems: "center",
  justifyContent: "center",
}

const $divider: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderLeftWidth: 1.5,
  borderLeftColor: colors.ink,
})

const $segmentOn: ThemedStyle<ViewStyle> = ({ colors }) => ({ backgroundColor: colors.ink })

const $label: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.medium,
  fontSize: 13,
  lineHeight: 16,
  letterSpacing: 0.8,
  color: colors.ink,
})

const $labelOn: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.paper })
