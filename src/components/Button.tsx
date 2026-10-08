import { ComponentType } from "react"
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native"

import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle, ThemedStyleArray } from "@/theme/types"

import { Text, TextProps } from "./Text"

type Presets = "default" | "filled" | "reversed" | "primary" | "danger" | "paper" | "ghostNight"

export interface ButtonAccessoryProps {
  style: StyleProp<any>
  pressableState: PressableStateCallbackType
  disabled?: boolean
}

export interface ButtonProps extends PressableProps {
  /**
   * Text which is looked up via i18n.
   */
  tx?: TextProps["tx"]
  /**
   * The text to display if not using `tx` or nested components.
   */
  text?: TextProps["text"]
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  txOptions?: TextProps["txOptions"]
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>
  /**
   * An optional style override for the "pressed" state.
   */
  pressedStyle?: StyleProp<ViewStyle>
  /**
   * An optional style override for the button text.
   */
  textStyle?: StyleProp<TextStyle>
  /**
   * An optional style override for the button text when in the "pressed" state.
   */
  pressedTextStyle?: StyleProp<TextStyle>
  /**
   * An optional style override for the button text when in the "disabled" state.
   */
  disabledTextStyle?: StyleProp<TextStyle>
  /**
   * One of the different types of button presets.
   */
  preset?: Presets
  /**
   * An optional component to render on the right side of the text.
   * Example: `RightAccessory={(props) => <View {...props} />}`
   */
  RightAccessory?: ComponentType<ButtonAccessoryProps>
  /**
   * An optional component to render on the left side of the text.
   * Example: `LeftAccessory={(props) => <View {...props} />}`
   */
  LeftAccessory?: ComponentType<ButtonAccessoryProps>
  /**
   * Children components.
   */
  children?: React.ReactNode
  /**
   * disabled prop, accessed directly for declarative styling reasons.
   * https://reactnative.dev/docs/pressable#disabled
   */
  disabled?: boolean
  /**
   * An optional style override for the disabled state
   */
  disabledStyle?: StyleProp<ViewStyle>
}

/**
 * A component that allows users to take actions and make choices.
 * Wraps the Text component with a Pressable component.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Button/}
 * @param {ButtonProps} props - The props for the `Button` component.
 * @returns {JSX.Element} The rendered `Button` component.
 * @example
 * <Button
 *   tx="common:ok"
 *   style={styles.button}
 *   textStyle={styles.buttonText}
 *   onPress={handleButtonPress}
 * />
 */
export function Button(props: ButtonProps) {
  const {
    tx,
    text,
    txOptions,
    style: $viewStyleOverride,
    pressedStyle: $pressedViewStyleOverride,
    textStyle: $textStyleOverride,
    pressedTextStyle: $pressedTextStyleOverride,
    disabledTextStyle: $disabledTextStyleOverride,
    children,
    RightAccessory,
    LeftAccessory,
    disabled,
    disabledStyle: $disabledViewStyleOverride,
    ...rest
  } = props

  const { themed } = useAppTheme()

  const preset: Presets = props.preset ?? "default"
  /**
   * @param {PressableStateCallbackType} root0 - The root object containing the pressed state.
   * @param {boolean} root0.pressed - The pressed state.
   * @returns {StyleProp<ViewStyle>} The view style based on the pressed state.
   */
  function $viewStyle({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> {
    return [
      themed($viewPresets[preset]),
      $viewStyleOverride,
      !!pressed && themed([$pressedViewPresets[preset], $pressedViewStyleOverride]),
      !!disabled && [$disabledViewStyle, $disabledViewStyleOverride],
    ]
  }
  /**
   * @param {PressableStateCallbackType} root0 - The root object containing the pressed state.
   * @param {boolean} root0.pressed - The pressed state.
   * @returns {StyleProp<TextStyle>} The text style based on the pressed state.
   */
  function $textStyle({ pressed }: PressableStateCallbackType): StyleProp<TextStyle> {
    return [
      themed($textPresets[preset]),
      $textStyleOverride,
      !!pressed && themed([$pressedTextPresets[preset], $pressedTextStyleOverride]),
      !!disabled && $disabledTextStyleOverride,
    ]
  }

  return (
    <Pressable
      style={$viewStyle}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
      disabled={disabled}
    >
      {(state) => (
        <>
          {!!LeftAccessory && (
            <LeftAccessory style={$leftAccessoryStyle} pressableState={state} disabled={disabled} />
          )}

          <Text tx={tx} text={text} txOptions={txOptions} style={$textStyle(state)}>
            {children}
          </Text>

          {!!RightAccessory && (
            <RightAccessory
              style={$rightAccessoryStyle}
              pressableState={state}
              disabled={disabled}
            />
          )}
        </>
      )}
    </Pressable>
  )
}

const $baseViewStyle: ThemedStyle<ViewStyle> = ({ spacing, radii, size }) => ({
  minHeight: size.controlHeight,
  borderRadius: radii.sm,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  overflow: "hidden",
})

// Condensed uppercase label, like a stamped form button.
const $baseTextStyle: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
  fontSize: 21,
  lineHeight: 24,
  fontFamily: typography.display.extraBold,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.ink,
  textAlign: "center",
  flexShrink: 1,
  flexGrow: 0,
  zIndex: 2,
})

const $rightAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginStart: spacing.xs,
  zIndex: 1,
})
const $leftAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginEnd: spacing.xs,
  zIndex: 1,
})

const $solid =
  (key: "ink" | "red" | "paper"): ThemedStyle<ViewStyle> =>
  ({ colors }) => ({ backgroundColor: colors[key] })

const $outline =
  (key: "ink" | "red" | "onNight"): ThemedStyle<ViewStyle> =>
  ({ colors }) => ({
    borderWidth: 1.5,
    borderColor: colors[key],
    backgroundColor: colors.transparent,
  })

const $viewPresets: Record<Presets, ThemedStyleArray<ViewStyle>> = {
  default: [$styles.row, $baseViewStyle, $outline("ink")],
  filled: [$styles.row, $baseViewStyle, $solid("ink")],
  reversed: [$styles.row, $baseViewStyle, $solid("ink")],
  primary: [$styles.row, $baseViewStyle, $solid("red")],
  danger: [$styles.row, $baseViewStyle, $outline("red")],
  paper: [$styles.row, $baseViewStyle, $solid("paper")],
  ghostNight: [$styles.row, $baseViewStyle, $outline("onNight")],
}

const $onDark: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.paper })

const $textPresets: Record<Presets, ThemedStyleArray<TextStyle>> = {
  default: [$baseTextStyle],
  filled: [$baseTextStyle, $onDark],
  reversed: [$baseTextStyle, $onDark],
  primary: [$baseTextStyle, $onDark],
  danger: [$baseTextStyle, ({ colors }) => ({ color: colors.red })],
  paper: [$baseTextStyle],
  ghostNight: [$baseTextStyle, ({ colors }) => ({ color: colors.onNight })],
}

const $pressedViewPresets: Record<Presets, ThemedStyle<ViewStyle>> = {
  default: ({ colors }) => ({ backgroundColor: colors.paper2 }),
  filled: ({ colors }) => ({ backgroundColor: colors.palette.neutral700 }),
  reversed: ({ colors }) => ({ backgroundColor: colors.palette.neutral700 }),
  primary: ({ colors }) => ({ backgroundColor: colors.palette.primary600 }),
  danger: ({ colors }) => ({ backgroundColor: colors.redWash }),
  paper: ({ colors }) => ({ backgroundColor: colors.paper2 }),
  ghostNight: ({ colors }) => ({ backgroundColor: colors.night2 }),
}

const $pressedTextPresets: Record<Presets, ThemedStyle<TextStyle>> = {
  default: () => ({ opacity: 0.9 }),
  filled: () => ({ opacity: 0.9 }),
  reversed: () => ({ opacity: 0.9 }),
  primary: () => ({ opacity: 0.9 }),
  danger: () => ({ opacity: 0.9 }),
  paper: () => ({ opacity: 0.9 }),
  ghostNight: () => ({ opacity: 0.9 }),
}

const $disabledViewStyle: ViewStyle = { opacity: 0.45 }
