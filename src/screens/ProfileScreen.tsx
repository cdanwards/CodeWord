import { View, ViewStyle, TextStyle, Alert } from "react-native"
import { router } from "expo-router"

import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Spacer } from "@/components/ui/Spacer"
import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export function ProfileScreen() {
  const { themed } = useAppTheme()
  const { user, isAuthenticated, signOut, isLoading } = useAuth()

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
      <Screen preset="fixed" style={$screen} contentContainerStyle={$contentContainer}>
        <Text preset="subheading">Loading profile...</Text>
      </Screen>
    )
  }

  // Generate username from email
  const getUsername = (email: string) => {
    return email.split("@")[0]
  }

  return (
    <Screen
      preset="scroll"
      keyboardShouldPersistTaps="always"
      safeAreaEdges={["top", "bottom"]}
      style={$screen}
      contentContainerStyle={$contentContainer}
    >
      {/* Profile Header */}
      <View style={themed($profileHeader)}>
        <Avatar name={user.name} image={user.image} size={80} />

        <Spacer size={16} />

        <Text preset="heading" style={themed($nameText)}>
          {user.name || "User"}
        </Text>

        <Text preset="subheading" style={themed($usernameText)}>
          @{getUsername(user.email)}
        </Text>

        <Text preset="default" style={themed($emailText)}>
          {user.email}
        </Text>

        <View style={themed($verificationStatus)}>
          <Text preset="formHelper" style={themed($verificationText)}>
            {user.emailVerified ? "✓ Email Verified" : "⚠ Email Not Verified"}
          </Text>
        </View>
      </View>

      <Spacer size={32} />

      {/* Profile Actions */}
      <View style={themed($actionsContainer)}>
        <Button
          text="Edit Profile"
          style={themed($actionButton)}
          onPress={handleEditProfile}
          disabled={isLoading}
        />

        <Spacer size={12} />

        <Button
          text="Settings"
          style={themed($secondaryButton)}
          onPress={handleSettings}
          disabled={isLoading}
        />

        <Spacer size={12} />

        <Button text="Sign Out" style={themed($signOutButton)} onPress={handleSignOut} />
      </View>

      <Spacer size={24} />

      {/* Account Info */}
      <View style={themed($accountInfoContainer)}>
        <Text preset="subheading" style={themed($sectionTitle)}>
          Account Information
        </Text>

        <View style={themed($infoRow)}>
          <Text preset="default" style={themed($infoLabel)}>
            Member since:
          </Text>
          <Text preset="default" style={themed($infoValue)}>
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={themed($infoRow)}>
          <Text preset="default" style={themed($infoLabel)}>
            Last updated:
          </Text>
          <Text preset="default" style={themed($infoValue)}>
            {new Date(user.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Screen>
  )
}

const $screen: ViewStyle = {
  flex: 1,
}

const $contentContainer: ViewStyle = {
  // paddingHorizontal: 24,
}

const $profileHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingTop: spacing.lg,
})

const $nameText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  textAlign: "center",
  marginBottom: 4,
})

const $usernameText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  opacity: 0.7,
  textAlign: "center",
  marginBottom: 8,
})

const $emailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  opacity: 0.6,
  textAlign: "center",
  marginBottom: 12,
})

const $verificationStatus: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderRadius: 12,
  backgroundColor: "rgba(0, 0, 0, 0.05)",
})

const $verificationText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  opacity: 0.8,
  textAlign: "center",
})

const $actionsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  paddingHorizontal: spacing.md,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.primary500,
  borderRadius: 12,
  paddingVertical: spacing.md,
})

const $secondaryButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  paddingVertical: spacing.md,
})

const $signOutButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.error,
  borderRadius: 12,
  paddingVertical: spacing.md,
})

const $accountInfoContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: "100%",
  paddingHorizontal: spacing.md,
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  marginBottom: spacing.md,
})

const $infoRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xs,
})

const $infoLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  opacity: 0.7,
})

const $infoValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "500",
})
