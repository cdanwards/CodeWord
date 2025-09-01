import { View } from "react-native"
import type { NativeStackHeaderProps } from "@react-navigation/native-stack"

import { Header } from "@/components/Header"
import { useAppTheme } from "@/theme/context"

export function AppHeader({ navigation, back }: NativeStackHeaderProps) {
  const {
    theme: { colors },
  } = useAppTheme()

  const title = "Codeword"

  const showBack = back != null

  return (
    <View>
      <Header
        rightText={title}
        backgroundColor={colors.background}
        leftIcon={showBack ? "back" : undefined}
        onLeftPress={showBack ? navigation.goBack : undefined}
        safeAreaEdges={["top"]}
      />
    </View>
  )
}
