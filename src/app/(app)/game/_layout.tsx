import { Stack } from "expo-router"

import { AppHeader } from "@/components/AppHeader"

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
        headerShown: true,
      }}
    />
  )
}
