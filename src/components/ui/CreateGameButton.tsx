import { useState } from "react"
import { Pressable, StyleProp, TextStyle, ViewStyle } from "react-native"

import { CreateGameModal } from "@/components/CreateGameModal"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface CreateGameButtonProps {
  onCreated?: (gameId: number) => void
  label?: string
  style?: StyleProp<ViewStyle>
}

/**
 * The ink "New operation" tile on HQ. Opens the create sheet.
 */
export function CreateGameButton({
  onCreated,
  label = "New operation",
  style,
}: CreateGameButtonProps) {
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
        <Text preset="label" style={themed($kicker)} text="Host" />
        <Text preset="subheading" style={themed($title)} text={label} />
      </Pressable>
      <CreateGameModal
        visible={visible}
        onClose={() => setVisible(false)}
        onCreated={(id) => {
          setVisible(false)
          onCreated?.(id)
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
  backgroundColor: colors.ink,
})

const $pressed: ViewStyle = { opacity: 0.85 }

const $kicker: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink3 })
const $title: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.paper })
