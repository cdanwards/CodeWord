import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Spacer } from "@/components/ui/Spacer"

export function HomeScreen({ navigation }: any) {
  return (
    <Screen preset="fixed" className="flex-1 justify-center items-center p-6">
      <Text preset="heading">Welcome to Codeword</Text>
      <Spacer size={12} />
      <Text preset="default">Outwit your friends in the ultimate word game</Text>
      <Spacer size={32} />
      <Button text="Join a Game" onPress={() => navigation.navigate("Games")} />
    </Screen>
  )
}
