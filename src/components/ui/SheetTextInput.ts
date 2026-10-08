import type { ElementType, RefAttributes } from "react"
// eslint-disable-next-line no-restricted-imports
import type { TextInput, TextInputProps } from "react-native"
import { BottomSheetTextInput } from "@gorhom/bottom-sheet"

/**
 * `BottomSheetTextInput` as an input our fields can render (`InputComponent`), so a bottom sheet
 * can track the keyboard. Gorhom types its ref as gesture-handler's TextInput, but at runtime it
 * forwards to React Native's, hence the cast.
 */
export const SheetTextInput = BottomSheetTextInput as unknown as ElementType<
  TextInputProps & RefAttributes<TextInput>
>
