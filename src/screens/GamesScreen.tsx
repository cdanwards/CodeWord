import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Spacer } from "@/components/ui/Spacer"

export function GamesScreen() {
  return (
    <Screen preset="fixed" style={$screen} contentContainerStyle={$contentContainer}>
      <Text preset="heading">Your Games</Text>
      <Spacer size={16} />
      <Text preset="default">You&apos;re not in any games yet.</Text>
      <Spacer size={32} />
      <Button text="Enter Game Code" onPress={() => {}} />
    </Screen>
  )
}

const $screen = {
  flex: 1,
}

const $contentContainer = {
  justifyContent: "center" as const,
  alignItems: "center" as const,
  padding: 24,
}
