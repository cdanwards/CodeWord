import { useEffect, useState } from "react"
import { Alert, Pressable, TextStyle, View, ViewStyle } from "react-native"
import { router } from "expo-router"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AgentPhoto } from "@/components/ui/AgentPhoto"
import { Rule } from "@/components/ui/Rule"
import { Sheet } from "@/components/ui/Sheet"
import { TopBar } from "@/components/ui/TopBar"
import { db } from "@/lib/database"
import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

type ServiceRecord = { operations: number; active: number; hosted: number }

/** "86b07292-..." -> "86B0-7292" */
function agentNumber(userId: string) {
  const raw = userId.replace(/-/g, "").slice(0, 8).toUpperCase()
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

/** dd.mm.yyyy */
function formatSince(value: Date | string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return `${dd}.${mm}.${date.getFullYear()}`
}

export function ProfileScreen() {
  const { themed } = useAppTheme()
  const { user, isAuthenticated, signOut, isLoading } = useAuth()
  const [record, setRecord] = useState<ServiceRecord | null>(null)

  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    db.getUserGames(userId)
      .then((games) => {
        if (cancelled) return
        setRecord({
          operations: games.length,
          active: games.filter((ug) => ug.games?.status === "active").length,
          hosted: games.filter((ug) => ug.role === "host").length,
        })
      })
      .catch(() => {
        // Stats stay as dashes.
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const handleSignOut = async () => {
    console.log("[ProfileScreen] handleSignOut")
    await signOut()
    console.log("[ProfileScreen] handleSignOut done")
    router.replace("/(auth)/login")
  }

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Profile editing coming soon!")
  }

  const handleSettings = () => {
    Alert.alert("Settings", "Settings coming soon!")
  }

  // If not authenticated, show loading or redirect
  if (!isAuthenticated || !user) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$loadingContainer}>
        <Text preset="label" text="Loading personnel file…" />
      </Screen>
    )
  }

  const since = formatSince(user.createdAt)
  const stats: { label: string; value: number | undefined; red?: boolean }[] = [
    { label: "Operations", value: record?.operations },
    { label: "Active", value: record?.active },
    { label: "Hosted", value: record?.hosted, red: true },
  ]

  return (
    <Screen
      preset="scroll"
      keyboardShouldPersistTaps="always"
      safeAreaEdges={["top"]}
      style={$screen}
      contentContainerStyle={$contentContainer}
    >
      <TopBar
        left={<Text preset="label" text="Personnel file" />}
        right={
          <Pressable
            onPress={handleEditProfile}
            disabled={isLoading}
            hitSlop={12}
            accessibilityRole="button"
          >
            <Text style={themed($link)} text="Edit" />
          </Pressable>
        }
      />

      {/* ID card */}
      <Sheet style={$card}>
        <View style={$cardTop}>
          <AgentPhoto caption="Agent photo" width={96} height={120} />
          <View style={$cardText}>
            <Text preset="label" text="Agent" />
            <Text preset="heading" style={$name} text={user.name || "Agent"} numberOfLines={2} />
            <View style={$cardMeta}>
              <Text preset="meta" text={`No. ${agentNumber(user.id)}`} />
              {!!since && <Text preset="meta" text={`Since ${since}`} />}
            </View>
          </View>
        </View>
        <Rule dashed style={$cardRule} />
        <Text preset="meta" text={user.email} />
      </Sheet>

      {/* Service record */}
      <Text preset="label" style={$sectionLabel} text="Service record" />
      <View style={themed($stats)}>
        {stats.map((stat, i) => (
          <View key={stat.label} style={[$stat, i > 0 && themed($statDivided)]}>
            <Text
              preset="heading"
              style={stat.red ? themed($red) : undefined}
              text={stat.value === undefined ? "–" : String(stat.value)}
            />
            <Text preset="label" text={stat.label} />
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={$list}>
        <Pressable
          onPress={handleSettings}
          disabled={isLoading}
          accessibilityRole="button"
          style={({ pressed }) => [$row, pressed && $pressed]}
        >
          <Text preset="copy" style={[themed($ink), $rowLabel]} text="Settings" />
          <Text preset="mono" text="→" />
        </Pressable>
        <Rule />
        <Pressable
          onPress={handleSignOut}
          accessibilityRole="button"
          style={({ pressed }) => [$row, pressed && $pressed]}
        >
          <Text preset="copy" style={[themed($red), $rowLabel]} text="Sign out" />
        </Pressable>
      </View>
    </Screen>
  )
}

const $screen: ViewStyle = {
  flex: 1,
}

const $contentContainer: ViewStyle = {
  paddingHorizontal: 22,
  paddingTop: 8,
  paddingBottom: 24,
}

const $loadingContainer: ViewStyle = {
  paddingHorizontal: 22,
  justifyContent: "center",
}

const $link: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.medium,
  fontSize: 13,
  lineHeight: 16,
  letterSpacing: 0.8,
  color: colors.red,
})

const $card: ViewStyle = {
  marginTop: 16,
}

const $cardTop: ViewStyle = {
  flexDirection: "row",
  gap: 16,
}

const $cardText: ViewStyle = {
  flex: 1,
  minWidth: 0,
}

const $name: TextStyle = {
  fontSize: 38,
  lineHeight: 37,
  marginTop: 6,
}

const $cardMeta: ViewStyle = {
  marginTop: "auto",
  paddingTop: 8,
}

const $cardRule: ViewStyle = {
  marginTop: 16,
  marginBottom: 12,
}

const $sectionLabel: TextStyle = {
  marginTop: 28,
}

const $stats: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  marginTop: 12,
  borderTopWidth: 1.5,
  borderTopColor: colors.ink,
  borderBottomWidth: 1,
  borderBottomColor: colors.rule,
})

const $stat: ViewStyle = {
  flex: 1,
  gap: 4,
  paddingVertical: 14,
}

const $statDivided: ThemedStyle<ViewStyle> = ({ colors }) => ({
  paddingLeft: 14,
  borderLeftWidth: 1,
  borderLeftColor: colors.rule,
})

const $red: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.red })
const $ink: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink })

const $list: ViewStyle = {
  marginTop: 20,
}

const $row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  minHeight: 56,
}

const $rowLabel: TextStyle = {
  flex: 1,
}

const $pressed: ViewStyle = {
  opacity: 0.6,
}
