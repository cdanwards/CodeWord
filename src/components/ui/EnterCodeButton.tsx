import { useState } from "react"
import { Pressable, StyleProp, TextStyle, View, ViewStyle } from "react-native"

import { JoinGameModal } from "@/components/JoinGameModal"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface EnterCodeButtonProps {
  onJoined?: (gameId: number) => void
  label?: string
  style?: StyleProp<ViewStyle>
}

// A half-typed code, as in the design.
const SAMPLE_CODE = ["M", "D", "", ""]

/**
 * The "Enter code" tile on HQ. Opens the join sheet.
 */
export function EnterCodeButton({ onJoined, label = "Enter code", style }: EnterCodeButtonProps) {
  const [visible, setVisible] = useState(false)
  const { themed } = useAppTheme()

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [themed($tile), style, pressed && $pressed]}
      >
        <View style={$boxes}>
          {SAMPLE_CODE.map((char, i) => (
            <View key={i} style={themed($box)}>
              {!!char && <Text style={themed($boxText)} text={char} />}
            </View>
          ))}
        </View>
        <Text preset="subheading" text={label} />
      </Pressable>
      <JoinGameModal
        visible={visible}
        onClose={() => setVisible(false)}
        onJoined={(id) => {
          setVisible(false)
          onJoined?.(id)
        }}
      />
    </>
  )
}

const $tile: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  height: 112,
  padding: 14,
  justifyContent: "space-between",
  borderWidth: 1.5,
  borderColor: colors.ink,
  borderRadius: 6,
  backgroundColor: colors.paper,
})

const $pressed: ViewStyle = { opacity: 0.85 }

const $boxes: ViewStyle = { flexDirection: "row", gap: 4 }

const $box: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 20,
  height: 26,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1.5,
  borderColor: colors.ink,
  borderRadius: 4,
  backgroundColor: colors.paper,
})

const $boxText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.semiBold,
  fontSize: 13,
  lineHeight: 16,
  color: colors.ink,
})
