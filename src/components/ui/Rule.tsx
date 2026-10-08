import { StyleProp, View, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"

export interface RuleProps {
  dashed?: boolean
  /**
   * Heavier ink line, used above a section like a form header.
   */
  strong?: boolean
  night?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * A horizontal rule. Dashed rules separate sections inside a sheet, like a tear line.
 */
export function Rule({ dashed, strong, night, style }: RuleProps) {
  const {
    theme: { colors },
  } = useAppTheme()

  if (dashed) {
    // iOS can't dash a single border side, so clip the top edge of a fully dashed box.
    return (
      <View style={[$dashClip, style]}>
        <View style={[$dashBox, { borderColor: colors.ruleStrong }]} />
      </View>
    )
  }

  const color = night ? colors.nightRule : strong ? colors.ink : colors.rule
  return <View style={[strong ? $strong : $thin, { backgroundColor: color }, style]} />
}

const $thin: ViewStyle = { height: 1 }
const $strong: ViewStyle = { height: 1.5 }
const $dashClip: ViewStyle = { height: 1.5, overflow: "hidden" }
const $dashBox: ViewStyle = { height: 6, borderWidth: 1.5, borderStyle: "dashed", borderRadius: 1 }
