import { useEffect, useRef, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModal as BottomSheetModalType,
  BottomSheetView,
} from "@gorhom/bottom-sheet"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { CodeBoxes } from "@/components/ui/CodeBoxes"
import { SheetTextInput } from "@/components/ui/SheetTextInput"
import { db } from "@/lib/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const CODE_LENGTH = 6

function errorMessage(e: unknown) {
  return e && typeof e === "object" && "message" in e ? String(e.message) : ""
}

interface JoinGameModalProps {
  visible: boolean
  onClose: () => void
  onJoined?: (gameId: number) => void
}

export function JoinGameModal({ visible, onClose, onJoined }: JoinGameModalProps) {
  const { themed } = useAppTheme()
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sheetRef = useRef<BottomSheetModalType>(null)

  // Reset form when modal closes
  const resetForm = () => {
    setCode("")
    setError(null)
  }

  const handleDismiss = () => {
    resetForm()
    onClose()
  }

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present()
    } else {
      sheetRef.current?.dismiss()
    }
  }, [visible])

  async function handleJoin() {
    setSubmitting(true)
    setError(null)
    try {
      const currentUserId = await db.getCurrentUserId()
      if (!currentUserId) {
        setError("Please sign in to join a game.")
        return
      }

      const trimmedCode = code.trim().toUpperCase()
      if (!trimmedCode) {
        setError("Game code is required")
        return
      }

      // Check if game exists
      const game = await db.findGameByCode(trimmedCode)
      if (!game) {
        setError("Game not found. Please check the code and try again.")
        return
      }

      // Check if user is already in the game
      const userGames = await db.getUserGames(currentUserId)
      const alreadyJoined = userGames.some((ug) => ug.gameId === game.id)
      if (alreadyJoined) {
        setError("You are already in this game.")
        return
      }

      // Join the game
      const userGame = await db.joinGameByCode(currentUserId, trimmedCode)
      if (!userGame) {
        setError("Failed to join game. Please try again.")
        return
      }

      onJoined?.(game.id as number)
      sheetRef.current?.dismiss()
      resetForm()
    } catch (e: unknown) {
      setError(errorMessage(e) || "An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = !submitting && code.trim().length === CODE_LENGTH

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enablePanDownToClose
      onDismiss={handleDismiss}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      backgroundStyle={themed($sheetBackground)}
      handleIndicatorStyle={themed($handleIndicator)}
    >
      <BottomSheetView style={$sheet}>
        <View style={$headerRow}>
          <Text preset="label" text="Incoming transmission" />
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            disabled={submitting}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={themed($closeMark)} text="×" />
          </Pressable>
        </View>

        <Text preset="display" text="Enter the code" style={$title} />
        <Text preset="copy" text="Six characters. Your host has it." style={$intro} />

        <View style={$codeBoxes}>
          <CodeBoxes
            value={code}
            onChangeText={setCode}
            length={CODE_LENGTH}
            autoFocus
            onSubmit={canSubmit ? handleJoin : undefined}
            InputComponent={SheetTextInput}
          />
        </View>

        <Text preset="meta" text="No O, 0, I or 1. Codes never use them." style={$hint} />
        {!!error && <Text preset="meta" text={error} style={themed($errorText)} />}

        <Button
          preset="primary"
          text={submitting ? "Decrypting…" : "Decrypt & join"}
          onPress={handleJoin}
          disabled={!canSubmit}
          style={$submit}
        />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const $sheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.paper,
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
})

const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.ruleStrong,
  width: 40,
  height: 5,
  borderRadius: 3,
})

// Content-sized (dynamic sizing), so no flex: 1 here.
const $sheet: ViewStyle = {
  paddingHorizontal: 22,
  paddingBottom: 34,
}

const $headerRow: ViewStyle = {
  height: 44,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $closeMark: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.medium,
  fontSize: 22,
  lineHeight: 26,
  color: colors.ink,
})

const $title: TextStyle = {
  marginTop: 10,
}

const $intro: TextStyle = {
  marginTop: 10,
}

const $codeBoxes: ViewStyle = {
  marginTop: 28,
}

const $hint: TextStyle = {
  marginTop: 14,
}

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  marginTop: 8,
  color: colors.red,
})

const $submit: ViewStyle = {
  marginTop: 24,
}
