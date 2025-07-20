import { View, ViewStyle, TextStyle, ImageStyle } from "react-native"
import { Image } from "react-native"

import { Text } from "@/components/Text"
import { Box } from "@/components/ui/Box"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface AvatarProps {
  /**
   * The user's name to generate initials from
   */
  name?: string
  /**
   * The user's profile image URL
   */
  image?: string | null
  /**
   * The size of the avatar (default: 80)
   */
  size?: number
  /**
   * Optional style override
   */
  style?: ViewStyle
}

export function Avatar({ name, image, size = 80, style }: AvatarProps) {
  const { themed } = useAppTheme()

  // Generate initials from user name
  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarSize = size
  const borderRadius = avatarSize / 2

  if (image) {
    return (
      <View
        style={[
          themed($avatarContainer),
          { width: avatarSize, height: avatarSize, borderRadius },
          style,
        ]}
      >
        <Image source={{ uri: image }} style={themed($avatarImage)} resizeMode="cover" />
      </View>
    )
  }

  return (
    <Box
      style={[themed($avatarBox), { width: avatarSize, height: avatarSize, borderRadius }, style]}
    >
      <Text preset="heading" style={themed($avatarText)}>
        {getInitials(name)}
      </Text>
    </Box>
  )
}

const $avatarContainer: ThemedStyle<ViewStyle> = () => ({
  overflow: "hidden",
})

const $avatarBox: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
  justifyContent: "center",
  alignItems: "center",
})

const $avatarImage: ThemedStyle<ImageStyle> = () => ({
  width: "100%",
  height: "100%",
})

const $avatarText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.background,
  fontSize: 24,
  fontWeight: "600",
})
