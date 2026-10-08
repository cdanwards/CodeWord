import { StyleProp, TextStyle, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Text } from "../Text"

export interface AgentPhotoProps {
  /**
   * The agent's name; initials are shown when there is no `caption`.
   */
  name?: string | null
  width: number
  height?: number
  /**
   * Caption for a large photo slot, e.g. "Target photo". Replaces the initials.
   */
  caption?: string
  style?: StyleProp<ViewStyle>
}

const STRIPE_GAP = 9

export function initialsOf(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

/**
 * Photo slot for an agent: a striped file-photo placeholder until real photos exist.
 */
export function AgentPhoto({ name, width, height = width, caption, style }: AgentPhotoProps) {
  const { themed } = useAppTheme()
  const diagonal = width + height
  const stripes = Math.ceil(diagonal / STRIPE_GAP)

  return (
    <View
      style={[themed($frame), { width, height }, caption ? $captioned : $centered, style]}
      accessibilityLabel={caption ?? name ?? "Agent photo"}
    >
      {Array.from({ length: stripes }, (_, i) => (
        <View
          key={i}
          style={[
            themed($stripe),
            { height: diagonal * 1.5, left: i * STRIPE_GAP - height, top: -diagonal * 0.25 },
          ]}
        />
      ))}
      {caption ? (
        <Text style={themed($caption)} text={caption} />
      ) : (
        <Text style={[themed($initials), { fontSize: Math.max(11, width * 0.3) }]}>
          {initialsOf(name)}
        </Text>
      )}
    </View>
  )
}

const $frame: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.paper2,
  borderWidth: 1,
  borderColor: colors.rule,
  borderRadius: 4,
  overflow: "hidden",
})

const $centered: ViewStyle = { alignItems: "center", justifyContent: "center" }
const $captioned: ViewStyle = { justifyContent: "flex-end", padding: 8 }

const $stripe: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  width: 1,
  backgroundColor: colors.rule,
  transform: [{ rotate: "45deg" }],
})

const $caption: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.medium,
  fontSize: 10,
  lineHeight: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: colors.ink2,
})

const $initials: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.semiBold,
  color: colors.ink,
})
