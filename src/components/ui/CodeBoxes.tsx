import { ElementType, RefAttributes, useRef } from "react"
// The hidden input is a raw TextInput on purpose: the visible field is the boxes.
// eslint-disable-next-line no-restricted-imports
import { Pressable, TextInput, TextInputProps, TextStyle, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Text } from "../Text"

// Join codes use this alphabet (see createGameHost): no O, 0, I or 1.
const NOT_IN_ALPHABET = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g

export interface CodeBoxesProps {
  value: string
  onChangeText: (value: string) => void
  length?: number
  autoFocus?: boolean
  onSubmit?: () => void
  /**
   * Render a different hidden input, e.g. `BottomSheetTextInput` inside a bottom sheet.
   */
  InputComponent?: ElementType<TextInputProps & RefAttributes<TextInput>>
}

/**
 * Six boxes for a join code, backed by one hidden TextInput.
 */
export function CodeBoxes({
  value,
  onChangeText,
  length = 6,
  autoFocus,
  onSubmit,
  InputComponent = TextInput,
}: CodeBoxesProps) {
  const input = useRef<TextInput>(null)
  const { themed } = useAppTheme()
  const chars = value.split("")
  const activeIndex = Math.min(chars.length, length - 1)

  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel="Join code">
      <View style={$row}>
        {Array.from({ length }, (_, i) => {
          const active = i === activeIndex && chars.length < length
          return (
            <View key={i} style={[themed($box), active && themed($boxActive)]}>
              {chars[i] ? (
                <Text style={themed($char)} text={chars[i]} />
              ) : active ? (
                <View style={themed($caret)} />
              ) : null}
            </View>
          )
        })}
      </View>
      <InputComponent
        ref={input}
        value={value}
        onChangeText={(text) =>
          onChangeText(text.toUpperCase().replace(NOT_IN_ALPHABET, "").slice(0, length))
        }
        maxLength={length}
        autoFocus={autoFocus}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        caretHidden
        style={$hiddenInput}
      />
    </Pressable>
  )
}

const $row: ViewStyle = { flexDirection: "row", justifyContent: "space-between" }

const $box: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 48,
  height: 62,
  borderWidth: 1.5,
  borderColor: colors.ink,
  borderRadius: 4,
  backgroundColor: colors.paper,
  alignItems: "center",
  justifyContent: "center",
})

const $boxActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.red,
  shadowColor: colors.red,
  shadowOpacity: 0.25,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 0 },
})

const $char: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.semiBold,
  fontSize: 28,
  lineHeight: 34,
  color: colors.ink,
})

const $caret: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 2,
  height: 30,
  backgroundColor: colors.red,
})

const $hiddenInput: TextStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  opacity: 0,
}
