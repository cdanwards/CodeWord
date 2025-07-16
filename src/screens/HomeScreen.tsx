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
      className="flex-1 justify-center items-center p-6 bg-blue-100"
    >
      <Text preset="heading" className="text-center text-2xl font-bold text-red-400">
        Welcome to Codeword
      </Text>
      <Spacer size={12} />
      <Text preset="default" className="text-blue-600">
        Outwit your friends in the ultimate word game
      </Text>
      <Spacer size={32} />
      <Button text="Join a Game" onPress={() => router.push("/games")} />
    </Screen>
  )
}
