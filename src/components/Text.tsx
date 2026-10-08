import { ReactNode, forwardRef, ForwardedRef } from "react"
// eslint-disable-next-line no-restricted-imports
import { StyleProp, Text as RNText, TextProps as RNTextProps, TextStyle } from "react-native"
import { TOptions } from "i18next"

import { isRTL, TxKeyPath } from "@/i18n"
import { translate } from "@/i18n/translate"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle, ThemedStyleArray } from "@/theme/types"
import { typography } from "@/theme/typography"

type Sizes = keyof typeof $sizeStyles
type Weights = keyof typeof typography.primary
type Presets =
  | "default"
  | "bold"
  | "display"
  | "heading"
  | "title"
  | "subheading"
  | "copy"
  | "label"
  | "meta"
  | "mono"
  | "formLabel"
  | "formHelper"

export interface TextProps extends RNTextProps {
  /**
   * Text which is looked up via i18n.
   */
  tx?: TxKeyPath
  /**
   * The text to display if not using `tx` or nested components.
   */
  text?: string
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  txOptions?: TOptions
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<TextStyle>
  /**
   * One of the different types of text presets.
   */
  preset?: Presets
  /**
   * Text weight modifier.
   */
  weight?: Weights
  /**
   * Text size modifier.
   */
  size?: Sizes
  /**
   * Children components.
   */
  children?: ReactNode
}

/**
 * For your text displaying needs.
 * This component is a HOC over the built-in React Native one.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Text/}
 * @param {TextProps} props - The props for the `Text` component.
 * @returns {JSX.Element} The rendered `Text` component.
 */
export const Text = forwardRef(function Text(props: TextProps, ref: ForwardedRef<RNText>) {
  const { weight, size, tx, txOptions, text, children, style: $styleOverride, ...rest } = props
  const { themed } = useAppTheme()

  const i18nText = tx && translate(tx, txOptions)
  const content = i18nText || text || children

  const preset: Presets = props.preset ?? "default"
  const $styles: StyleProp<TextStyle> = [
    $rtlStyle,
    themed($presets[preset]),
    weight && $fontWeightStyles[weight],
    size && $sizeStyles[size],
    $styleOverride,
  ]

  return (
    <RNText {...rest} style={$styles} ref={ref}>
      {content}
    </RNText>
  )
})

const $sizeStyles = {
  xxl: { fontSize: 36, lineHeight: 44 } satisfies TextStyle,
  xl: { fontSize: 24, lineHeight: 34 } satisfies TextStyle,
  lg: { fontSize: 20, lineHeight: 32 } satisfies TextStyle,
  md: { fontSize: 18, lineHeight: 26 } satisfies TextStyle,
  sm: { fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  xs: { fontSize: 14, lineHeight: 21 } satisfies TextStyle,
  xxs: { fontSize: 12, lineHeight: 18 } satisfies TextStyle,
}

const $fontWeightStyles = Object.entries(typography.primary).reduce((acc, [weight, fontFamily]) => {
  return { ...acc, [weight]: { fontFamily } }
}, {}) as Record<Weights, TextStyle>

const $baseStyle: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 15,
  lineHeight: 22,
  ...$fontWeightStyles.normal,
  color: theme.colors.text,
})

// Condensed uppercase headline. lineHeight sits just above fontSize: tight like the design's
// 0.9 leading, without clipping caps on iOS.
const $display = (fontSize: number): TextStyle => ({
  fontFamily: typography.display.extraBold,
  fontSize,
  lineHeight: Math.round(fontSize * 0.98),
  textTransform: "uppercase",
})

const $label: ThemedStyle<TextStyle> = (theme) => ({
  fontFamily: typography.mono.medium,
  fontSize: 11,
  lineHeight: 15,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: theme.colors.ink2,
})

const $copy: ThemedStyle<TextStyle> = (theme) => ({ color: theme.colors.ink2 })

const $presets: Record<Presets, ThemedStyleArray<TextStyle>> = {
  default: [$baseStyle],
  bold: [$baseStyle, { ...$fontWeightStyles.bold }],
  display: [$baseStyle, $display(58)],
  heading: [$baseStyle, $display(46)],
  title: [$baseStyle, $display(30)],
  subheading: [$baseStyle, $display(23)],
  copy: [$baseStyle, $copy],
  label: [$baseStyle, $label],
  meta: [
    $baseStyle,
    (theme) => ({
      fontFamily: typography.mono.normal,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.ink2,
    }),
  ],
  mono: [$baseStyle, { fontFamily: typography.mono.normal }],
  formLabel: [$baseStyle, $label],
  formHelper: [$baseStyle, $copy],
}
const $rtlStyle: TextStyle = isRTL ? { writingDirection: "rtl" } : {}
