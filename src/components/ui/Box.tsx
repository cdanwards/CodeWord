import { ReactNode } from "react"
import { View, ViewProps } from "react-native"

interface BoxProps extends ViewProps {
  children?: ReactNode
}

export function Box({ children, style, ...rest }: BoxProps) {
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  )
}
