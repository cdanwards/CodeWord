import { View, ViewStyle, TextStyle } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Spacer } from "@/components/ui/Spacer"

export function HomeScreen() {
  const router = useRouter()

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      style={$screen}
      contentContainerStyle={$contentContainer}
    >
      <View style={$redBox}>
        <Text style={$whiteText}>Test Red Background</Text>
      </View>
      <Spacer size={12} />
      <Text style={$blueText}>Test Blue Text</Text>
      <Spacer size={32} />
      <Button text="Join a Game" onPress={() => router.push("/games")} />
    </Screen>
  )
}

const $screen: ViewStyle = {
  flex: 1,
}

const $contentContainer: ViewStyle = {
  justifyContent: "center" as const,
  alignItems: "center" as const,
  padding: 24,
}

const $redBox: ViewStyle = {
  backgroundColor: "#ef4444",
  padding: 16,
  borderRadius: 8,
}

const $whiteText: TextStyle = {
  color: "#ffffff",
  fontSize: 18,
  fontWeight: "bold" as const,
}

const $blueText: TextStyle = {
  color: "#3b82f6",
  fontSize: 18,
}
