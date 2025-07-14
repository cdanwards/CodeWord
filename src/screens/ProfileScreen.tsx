import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Box } from "@/components/ui/Box"
import { Spacer } from "@/components/ui/Spacer"

export function ProfileScreen() {
  return (
    <Screen preset="fixed" className="flex-1 justify-center items-center p-6">
      <Box className="w-20 h-20 rounded-full bg-neutral-200 justify-center items-center">
        <Text preset="heading">JD</Text>
      </Box>
      <Spacer size={16} />
      <Text preset="subheading">@john_doe</Text>
      <Spacer size={32} />
      <Button text="Edit Profile" onPress={() => {}} />
    </Screen>
  )
}
