import { ReactNode } from "react"
import { Pressable, StyleProp, TextStyle, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Text } from "../Text"

export interface FolderProps {
  /**
   * Text on the folder tab, e.g. "No. MDBZGU".
   */
  tab: string
  /**
   * Closed files fade to plain paper.
   */
  closed?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

/** Height of the tab that sits above the folder; callers leave this much room above it. */
export const FOLDER_TAB_HEIGHT = 26

/**
 * A manila case folder with a labeled tab. Each game is one.
 */
export function Folder({ tab, closed, onPress, style, children }: FolderProps) {
  const { themed } = useAppTheme()
  const $fill = closed ? themed($closedFill) : undefined

  const body = (
    <View style={[themed($body), $fill, style]}>
      {children}
      {/* Rendered last so the tab covers the body's top border where they meet. */}
      <View style={[themed($tab), $fill]}>
        <Text style={[themed($tabText), closed && themed($closedTabText)]} text={tab} />
      </View>
    </View>
  )

  if (!onPress) return <View style={$outer}>{body}</View>
  return (
    <Pressable
      style={({ pressed }) => [$outer, pressed && { opacity: 0.85 }]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {body}
    </Pressable>
  )
}

const $outer: ViewStyle = { paddingTop: FOLDER_TAB_HEIGHT }

const $body: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "relative",
  backgroundColor: colors.manila,
  borderWidth: 1,
  borderColor: colors.folderBorder,
  borderRadius: 8,
  borderTopLeftRadius: 0,
  padding: 16,
})

const $tab: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  left: -1,
  top: -FOLDER_TAB_HEIGHT,
  height: FOLDER_TAB_HEIGHT + 1,
  paddingHorizontal: 14,
  justifyContent: "center",
  backgroundColor: colors.manila,
  borderWidth: 1,
  borderBottomWidth: 0,
  borderColor: colors.folderBorder,
  borderTopLeftRadius: 8,
  borderTopRightRadius: 8,
})

const $tabText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.semiBold,
  fontSize: 11,
  lineHeight: 14,
  letterSpacing: 1.3,
  textTransform: "uppercase",
  color: colors.ink,
})

const $closedFill: ThemedStyle<ViewStyle> = ({ colors }) => ({ backgroundColor: colors.paper2 })
const $closedTabText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink2 })
