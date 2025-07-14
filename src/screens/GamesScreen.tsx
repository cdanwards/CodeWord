import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Spacer } from "@/components/ui/Spacer"

export function GamesScreen() {
  return (
    <Screen preset="fixed" className="flex-1 justify-center items-center p-6">
      <Text preset="heading">Your Games</Text>
      <Spacer size={16} />
      <Text preset="default">You're not in any games yet.</Text>
      <Spacer size={32} />
      <Button text="Enter Game Code" onPress={() => {}} />
    </Screen>
  )
}
