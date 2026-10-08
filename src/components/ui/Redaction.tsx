import { StyleProp, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"

export interface RedactionProps {
  width: number
  height?: number
  night?: boolean
  style?: StyleProp<ViewStyle>
}

const $bar: ViewStyle = { borderRadius: 2 }

/**
 * A redaction bar: hides a secret (like a codeword) without saying what it is.
 */
export function Redaction({ width, height = 13, night, style }: RedactionProps) {
  const {
    theme: { colors },
  } = useAppTheme()
  return (
    <View
      accessible
      accessibilityLabel="Redacted"
      style={[$bar, { width, height, backgroundColor: night ? colors.onNight : colors.ink }, style]}
    />
  )
}
