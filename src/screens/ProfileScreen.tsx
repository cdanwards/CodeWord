import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Box } from "@/components/ui/Box"
import { Spacer } from "@/components/ui/Spacer"

export function ProfileScreen() {
  return (
    <Screen preset="fixed" style={$screen} contentContainerStyle={$contentContainer}>
      <Box style={$avatarBox}>
        <Text preset="heading">JD</Text>
      </Box>
      <Spacer size={16} />
      <Text preset="subheading">@john_doe</Text>
      <Spacer size={32} />
      <Button text="Edit Profile" onPress={() => {}} />
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

const $avatarBox = {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: "#e5e5e5",
  justifyContent: "center" as const,
  alignItems: "center" as const,
}
