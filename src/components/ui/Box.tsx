import { ReactNode } from "react"
import { View, ViewProps } from "react-native"

interface BoxProps extends ViewProps {
  children?: ReactNode
  /**
   * Tailwind CSS classes for styling.
   */
  className?: string
}

export function Box({ children, style, className, ...rest }: BoxProps) {
  return (
    <View style={style} className={className} {...rest}>
      {children}
    </View>
  )
}
