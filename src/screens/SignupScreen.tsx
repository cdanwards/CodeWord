import { useState } from "react"
import { Alert, TextStyle, View, ViewStyle } from "react-native"
import { router } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, TextFieldProps } from "@/components/TextField"
import { TopBar } from "@/components/ui/TopBar"
import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

type Field = "name" | "email" | "password" | "confirmPassword"
type FieldErrors = Partial<Record<Field, string>>

/**
 * 02 Enlist: recruitment form. Numbered form lines; red numerals are the only color on the page.
 */
export const SignupScreen = function SignupScreen() {
  const { themed } = useAppTheme()
  const { signUp, isLoading, clearError } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const validateForm = () => {
    if (!name.trim()) {
      setFieldErrors({ name: "Please enter your name" })
      return false
    }
    if (!email.trim()) {
      setFieldErrors({ email: "Please enter your email" })
      return false
    }
    if (!email.includes("@")) {
      setFieldErrors({ email: "Please enter a valid email address" })
      return false
    }
    if (password.length < 8) {
      setFieldErrors({ password: "Passphrase must be at least 8 characters" })
      return false
    }
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passphrases do not match" })
      return false
    }
    setFieldErrors({})
    return true
  }

  const handleSignup = async () => {
    setFormError(null)
    if (!validateForm()) return

    clearError()
    const result = await signUp(email, password, name)

    if (result.success) {
      Alert.alert("Success!", "Account created successfully! Welcome to Codeword!", [
        {
          text: "Get Started",
          onPress: () => router.replace("/(app)/(tabs)/home"),
        },
      ])
    } else if (result.error) {
      setFormError(result.error)
    }
  }

  /** Clears the field's error as soon as the agent edits it. */
  const edit = (field: Field, setter: (value: string) => void) => (value: string) => {
    setter(value)
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    if (formError) setFormError(null)
  }

  const errorProps = (field: Field): Pick<TextFieldProps, "status" | "helper"> =>
    fieldErrors[field] ? { status: "error", helper: fieldErrors[field] } : {}

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={themed($content)}
      ScrollViewProps={{ showsVerticalScrollIndicator: false }}
    >
      <TopBar left="back" label="Form 27-B · Recruitment" />

      <Text preset="display" style={themed($title)} text="Enlist" />
      <Text
        preset="copy"
        style={themed($intro)}
        text="Open your file. Your name is what other agents see when you're their target."
      />

      {/* Numbered form lines */}
      <View style={themed($form)}>
        <View style={themed($line)}>
          <Text style={themed($formNo)} text="01" />
          <TextField
            value={name}
            onChangeText={edit("name", setName)}
            containerStyle={themed($field)}
            autoCapitalize="words"
            autoComplete="name"
            autoCorrect={false}
            label="Full name"
            placeholder="Agent name"
            {...errorProps("name")}
          />
        </View>

        <View style={themed($line)}>
          <Text style={themed($formNo)} text="02" />
          <TextField
            value={email}
            onChangeText={edit("email", setEmail)}
            containerStyle={themed($field)}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            label="Email"
            placeholder="you@agency.com"
            {...errorProps("email")}
          />
        </View>

        <View style={themed($line)}>
          <Text style={themed($formNo)} text="03" />
          <TextField
            value={password}
            onChangeText={edit("password", setPassword)}
            containerStyle={themed($field)}
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect={false}
            secureTextEntry={true}
            label="Passphrase"
            placeholder="8+ characters"
            {...errorProps("password")}
          />
        </View>

        <View style={themed($line)}>
          <Text style={themed($formNo)} text="04" />
          <TextField
            value={confirmPassword}
            onChangeText={edit("confirmPassword", setConfirmPassword)}
            containerStyle={themed($field)}
            autoCapitalize="none"
            autoComplete="new-password"
            autoCorrect={false}
            secureTextEntry={true}
            label="Confirm passphrase"
            placeholder="Once more"
            {...errorProps("confirmPassword")}
          />
        </View>
      </View>

      {/* Submit, pushed to the bottom */}
      <View style={themed($actions)}>
        {!!formError && (
          <Text
            preset="meta"
            style={themed($errorLine)}
            text={formError}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          />
        )}

        <Button preset="filled" text="Submit file" onPress={handleSignup} disabled={isLoading} />

        <Text preset="meta" style={themed($footer)}>
          Already an agent?{" "}
          <Text
            style={themed($link)}
            text="Sign in"
            accessibilityRole="link"
            onPress={() => router.push("/login")}
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

const $title: ThemedStyle<TextStyle> = () => ({ marginTop: 18 })

const $intro: ThemedStyle<TextStyle> = () => ({ marginTop: 10 })

const $form: ThemedStyle<ViewStyle> = () => ({
  marginTop: 28,
  gap: 20,
})

const $line: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $formNo: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  width: 28,
  paddingTop: 2,
  fontFamily: typography.mono.medium,
  fontSize: 12,
  lineHeight: 15,
  color: colors.red,
})

const $field: ThemedStyle<ViewStyle> = () => ({ flex: 1 })

const $actions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: "auto",
  paddingTop: spacing.xl,
  gap: spacing.md,
})

const $errorLine: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.red,
  textAlign: "center",
})

const $footer: ThemedStyle<TextStyle> = () => ({ textAlign: "center" })

const $link: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.medium,
  fontSize: 13,
  letterSpacing: 0.8,
  color: colors.red,
})
