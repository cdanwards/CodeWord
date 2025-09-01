import { useState } from "react"
import { StyleProp, ViewStyle, TextStyle } from "react-native"

import { Button } from "@/components/Button"
import type { ButtonAccessoryProps } from "@/components/Button"
import { JoinGameModal } from "@/components/JoinGameModal"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { darkTheme } from "@/theme/theme"
import type { ThemedStyle } from "@/theme/types"

export interface EnterCodeButtonProps {
  onJoined?: (gameId: number) => void
  label?: string
  style?: StyleProp<ViewStyle>
}

export function EnterCodeButton({
  onJoined,
  label = "Enter Game Code",
  style,
}: EnterCodeButtonProps) {
  const [visible, setVisible] = useState(false)
  const { themed } = useAppTheme()

  return (
    <>
      <Button
        text={label}
        onPress={() => setVisible(true)}
        style={[themed($button), style]}
        LeftAccessory={({ style: accessoryStyle }: ButtonAccessoryProps) => (
          <Text size="xl" weight="medium" style={[themed($keyboardText), accessoryStyle]}>
            ⌨️
          </Text>
        )}
      />
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

const $button: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  borderRadius: 8,
  borderColor: darkTheme.colors.palette.neutral100,
  borderWidth: 1,
})
const $keyboardText: ThemedStyle<TextStyle> = () => ({ paddingRight: 12 })
