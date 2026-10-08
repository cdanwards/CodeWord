import { ReactNode } from "react"
import { StyleProp, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface SheetProps {
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

/**
 * A sheet of paper: the dossier's card surface (ID cards, target files, reports).
 */
export function Sheet({ style, children }: SheetProps) {
  const { themed } = useAppTheme()
  return <View style={[themed($sheet), style]}>{children}</View>
}

const $sheet: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.paper,
  borderWidth: 1,
  borderColor: colors.rule,
  borderRadius: 6,
  padding: 16,
  shadowColor: colors.ink,
  shadowOpacity: 0.16,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
})
