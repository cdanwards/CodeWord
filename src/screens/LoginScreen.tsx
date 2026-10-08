import { useState } from "react"
import { Alert, Pressable, TextStyle, View, ViewStyle } from "react-native"
import { router } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Rule } from "@/components/ui/Rule"
import { Stamp } from "@/components/ui/Stamp"
import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

/**
 * 01 Sign in: the classified cover sheet. The only night screen outside an active mission.
 */
export const LoginScreen = function LoginScreen() {
  const { themed, theme } = useAppTheme()
  const { signIn, isLoading, clearError } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email || !password) {
      setFormError("Please fill in all fields")
      return
    }

    setFormError(null)
    clearError()
    const result = await signIn(email, password)

    if (result.success) {
      // Navigate directly to the home tab
      router.replace("/(app)/(tabs)/home")
    } else if (result.error) {
      setFormError(result.error)
    }
  }

  const handleForgotPassword = () => {
    Alert.alert("Forgot Password", "Password reset functionality coming soon!")
  }

  const onChangeEmail = (value: string) => {
    setEmail(value)
    if (formError) setFormError(null)
  }

  const onChangePassword = (value: string) => {
    setPassword(value)
    if (formError) setFormError(null)
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      backgroundColor={theme.colors.night}
      systemBarStyle="light"
      contentContainerStyle={themed($content)}
      ScrollViewProps={{ showsVerticalScrollIndicator: false }}
    >
      {/* File header */}
      <View style={themed($fileRow)}>
        <Text preset="label" style={themed($onNight2)} text="Dept. of Word Assassins" />
        <Text preset="label" style={themed($onNight2)} text="File 00-A" />
      </View>
      <Rule night style={themed($fileRule)} />

      {/* Cover */}
      <View style={themed($cover)}>
        <Text preset="display" style={themed($wordmark)} text={"Code\nword"} />
        <Stamp text="Top secret" rotate={-9} style={themed($stamp)} />
        <Text
          preset="copy"
          style={themed([$onNight2, $tagline])}
          text="Get your target to say the word. Don't say yours."
        />
      </View>

      {/* Sign-in form, pushed to the bottom */}
      <View style={themed($form)}>
        <TextField
          tone="night"
          value={email}
          onChangeText={onChangeEmail}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          label="Agent email"
          placeholder="you@agency.com"
        />

        <View>
          <View style={themed($labelRow)}>
            <Text preset="formLabel" style={themed($onNight2)} text="Passphrase" />
            <Pressable
              onPress={handleForgotPassword}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Forgot passphrase?"
            >
              <Text style={themed($link)} text="Forgot?" />
            </Pressable>
          </View>
          <TextField
            tone="night"
            value={password}
            onChangeText={onChangePassword}
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            secureTextEntry={true}
            accessibilityLabel="Passphrase"
          />
        </View>

        {!!formError && (
          <Text
            preset="meta"
            style={themed($errorLine)}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text preset="meta" style={themed($errorMark)} text="× " />
            {formError}
          </Text>
        )}

        <Button
          preset="primary"
          text="Sign in"
          style={themed($submit)}
          onPress={handleLogin}
          disabled={isLoading}
        />

        <Text preset="meta" style={themed([$onNight2, $footer])}>
          New recruit?{" "}
          <Text
            style={themed($link)}
            text="Enlist →"
            accessibilityRole="link"
            onPress={() => router.push("/signup")}
          />
        </Text>
      </View>
    </Screen>
  )
}

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: 22,
  paddingTop: spacing.xs,
  paddingBottom: spacing.md,
})

const $onNight2: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.onNight2 })

const $fileRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 18,
  gap: 12,
})

const $fileRule: ThemedStyle<ViewStyle> = ({ spacing }) => ({ marginTop: spacing.sm })

const $cover: ThemedStyle<ViewStyle> = () => ({
  position: "relative",
  paddingTop: 40,
})

const $wordmark: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.onNight,
  fontSize: 100,
  lineHeight: 96,
})

// Hand-applied over the right edge of the wordmark, across the two lines.
const $stamp: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  right: 6,
  top: 120,
})

const $tagline: ThemedStyle<TextStyle> = () => ({
  marginTop: 18,
  maxWidth: 280,
})

const $form: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: "auto",
  paddingTop: spacing.xl,
  gap: spacing.lg,
})

const $labelRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $link: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.medium,
  fontSize: 13,
  lineHeight: 18,
  letterSpacing: 0.8,
  color: colors.red,
})

const $errorLine: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.onNight })

const $errorMark: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.red })

const $submit: ThemedStyle<ViewStyle> = () => ({ marginTop: 6 })

const $footer: ThemedStyle<TextStyle> = () => ({ textAlign: "center" })
