import { useState } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native"
import { router } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"
import { $styles } from "@/theme/styles"
import type { ThemedStyle } from "@/theme/types"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"

const logoImage = require("@assets/images/logo.png")

export const LoginScreen = function LoginScreen() {
  const { themed } = useAppTheme()
  const { signIn, isLoading, clearError } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const $bottomContainerInsets = useSafeAreaInsetsStyle(["bottom"])

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    clearError()
    const result = await signIn(email, password)

    if (result.success) {
      // Navigate directly to the home tab
      router.replace("/(app)/home")
    } else if (result.error) {
      Alert.alert("Error", result.error)
    }
  }

  const handleForgotPassword = () => {
    Alert.alert("Forgot Password", "Password reset functionality coming soon!")
  }

  return (
    <Screen preset="scroll" contentContainerStyle={$styles.flex1}>
      <KeyboardAvoidingView
        style={$styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={$styles.flex1}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={themed($headerContainer)}>
            <Image style={themed($logo)} source={logoImage} resizeMode="contain" />
            <Text style={themed($title)} text="Welcome Back!" preset="heading" />
            <Text
              style={themed($subtitle)}
              text="Sign in to continue to your account"
              preset="subheading"
            />
          </View>

          {/* Login Form */}
          <View style={themed($formContainer)}>
            <TextField
              value={email}
              onChangeText={setEmail}
              containerStyle={themed($inputContainer)}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              label="Email"
              placeholder="Enter your email"
            />

            <TextField
              value={password}
              onChangeText={setPassword}
              containerStyle={themed($inputContainer)}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              secureTextEntry={true}
              label="Password"
              placeholder="Enter your password"
            />

            <Button
              text="Forgot Password?"
              preset="reversed"
              style={themed($forgotPasswordButton)}
              textStyle={themed($forgotPasswordText)}
              onPress={handleForgotPassword}
            />

            <Button
              text="Sign In"
              style={themed($signInButton)}
              textStyle={themed($signInButtonText)}
              onPress={handleLogin}
              disabled={isLoading}
            />
          </View>

          {/* Footer */}
          <View style={themed([$footerContainer, $bottomContainerInsets])}>
            <Text style={themed($footerText)} text="Don't have an account? " />
            <Text
              style={themed($footerLink)}
              text="Sign up"
              onPress={() => router.push("signup" as any)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
  paddingBottom: spacing.lg,
})

const $logo: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  height: 60,
  width: 120,
  marginBottom: spacing.lg,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
  textAlign: "center",
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  textAlign: "center",
  color: colors.text,
  opacity: 0.7,
})

const $formContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
})

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $forgotPasswordButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "flex-end",
  marginBottom: spacing.lg,
  minHeight: 0,
  paddingVertical: 0,
})

const $forgotPasswordText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  fontSize: 14,
})

const $signInButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.lg,
  backgroundColor: colors.palette.primary500,
  borderRadius: 12,
  paddingVertical: spacing.md,
})

const $signInButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  fontWeight: "600",
})

const $footerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.lg,
})

const $footerText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  opacity: 0.7,
})

const $footerLink: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  fontWeight: "600",
})
