import { useState } from "react"
import { StyleProp, ViewStyle, TextStyle } from "react-native"

import { Button } from "@/components/Button"
import type { ButtonAccessoryProps } from "@/components/Button"
import { CreateGameModal } from "@/components/CreateGameModal"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface CreateGameButtonProps {
  onCreated?: (gameId: number) => void
  label?: string
  style?: StyleProp<ViewStyle>
}

export function CreateGameButton({
  onCreated,
  label = "Create New Game",
  style,
}: CreateGameButtonProps) {
  const [visible, setVisible] = useState(false)
  const { themed } = useAppTheme()

  return (
    <>
      <Button
        preset="reversed"
        text={label}
        onPress={() => setVisible(true)}
        style={[themed($button), style]}
        LeftAccessory={({ style: accessoryStyle }: ButtonAccessoryProps) => (
          <Text size="xl" weight="medium" style={[themed($plusText), accessoryStyle]}>
            +
          </Text>
        )}
      />
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

const $button: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  borderRadius: 8,
})
const $plusText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  paddingRight: 12,
})
