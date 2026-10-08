import { View, ViewStyle } from "react-native"
import { Tabs } from "expo-router"

import { useAppTheme } from "@/theme/context"

export default function TabsLayout() {
  const {
    theme: { colors, typography },
  } = useAppTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.rule },
        tabBarLabelStyle: {
          fontFamily: typography.mono.semiBold,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        },
        // A plain square mark, filled red on the active tab.
        tabBarIcon: ({ focused, color }) => (
          <View
            style={[
              $tabMark,
              {
                borderColor: focused ? colors.red : color,
                backgroundColor: focused ? colors.red : colors.transparent,
              },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen name="home" options={{ title: "HQ" }} />
      <Tabs.Screen name="profile" options={{ title: "Agent" }} />
    </Tabs>
  )
}

const $tabMark: ViewStyle = { width: 18, height: 18, borderRadius: 3, borderWidth: 1.5 }
