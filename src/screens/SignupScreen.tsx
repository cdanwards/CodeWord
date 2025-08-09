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

export const SignupScreen = function SignupScreen() {
  const { themed } = useAppTheme()
  const { signUp, isLoading, clearError } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const $bottomContainerInsets = useSafeAreaInsetsStyle(["bottom"])

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name")
      return false
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email")
      return false
    }
    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address")
      return false
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long")
      return false
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return false
    }
    return true
  }

  const handleSignup = async () => {
    if (!validateForm()) return

    clearError()
    const result = await signUp(email, password, name)

    if (result.success) {
      Alert.alert("Success!", "Account created successfully! Welcome to Codeword!", [
        {
          text: "Get Started",
          onPress: () => router.replace("/(app)/home"),
        },
      ])
    } else if (result.error) {
      Alert.alert("Error", result.error)
    }
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
            <Text style={themed($title)} text="Create Account" preset="heading" />
            <Text
              style={themed($subtitle)}
              text="Sign up to start playing Codeword"
              preset="subheading"
            />
          </View>

          {/* Signup Form */}
          <View style={themed($formContainer)}>
            <TextField
              value={name}
              onChangeText={setName}
              containerStyle={themed($inputContainer)}
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect={false}
              label="Full Name"
              placeholder="Enter your full name"
            />

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
              autoComplete="new-password"
              autoCorrect={false}
              secureTextEntry={true}
              label="Password"
              placeholder="Create a password"
            />

            <TextField
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              containerStyle={themed($inputContainer)}
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              secureTextEntry={true}
              label="Confirm Password"
              placeholder="Confirm your password"
            />

            <Button
              text="Create Account"
              style={themed($signUpButton)}
              textStyle={themed($signUpButtonText)}
              onPress={handleSignup}
              disabled={isLoading}
            />
          </View>

          {/* Footer */}
          <View style={themed([$footerContainer, $bottomContainerInsets])}>
            <Text style={themed($footerText)} text="Already have an account? " />
            <Text
              style={themed($footerLink)}
              text="Sign in"
              onPress={() => router.push("login" as any)}
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

const $signUpButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.lg,
  backgroundColor: colors.palette.primary500,
  borderRadius: 12,
  paddingVertical: spacing.md,
})

const $signUpButtonText: ThemedStyle<TextStyle> = () => ({
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
