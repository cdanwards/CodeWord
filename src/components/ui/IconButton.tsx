import { Pressable, PressableProps, ViewStyle } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Icon, IconTypes } from "../Icon"

export interface IconButtonProps extends PressableProps {
  icon: IconTypes
  size?: number
}

export function IconButton({ icon, size = 36, style, ...rest }: IconButtonProps) {
  const { themed } = useAppTheme()
  return (
    <Pressable
      style={[themed($container(size)) as ViewStyle, style as ViewStyle]}
      accessibilityRole="button"
      {...rest}
    >
      <Icon icon={icon} size={20} />
    </Pressable>
  )
}

const $container: (s: number) => ThemedStyle<ViewStyle> =
  (s) =>
  ({ colors, radii }) => ({
    height: s,
    width: s,
    borderRadius: radii.md,
    backgroundColor: colors.palette.neutral100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.separator,
  })
