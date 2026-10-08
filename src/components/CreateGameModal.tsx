import { useEffect, useRef, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModal as BottomSheetModalType,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Segmented, SegmentedOption } from "@/components/ui/Segmented"
import { SheetTextInput } from "@/components/ui/SheetTextInput"
import { db } from "@/lib/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const DEFAULT_DURATION_HOURS = 72

const DURATION_OPTIONS: SegmentedOption<number>[] = [
  { label: "24h", value: 24 },
  { label: "48h", value: 48 },
  { label: "72h", value: 72 },
  { label: "1 week", value: 168 },
]

function errorMessage(e: unknown) {
  return e && typeof e === "object" && "message" in e ? String(e.message) : ""
}

interface CreateGameModalProps {
  visible: boolean
  onClose: () => void
  onCreated?: (gameId: number) => void
}

export function CreateGameModal({ visible, onClose, onCreated }: CreateGameModalProps) {
  const { themed } = useAppTheme()
  const insets = useSafeAreaInsets()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [durationHours, setDurationHours] = useState(DEFAULT_DURATION_HOURS)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sheetRef = useRef<BottomSheetModalType>(null)

  // Reset form when modal closes
  const resetForm = () => {
    setName("")
    setDescription("")
    setDurationHours(DEFAULT_DURATION_HOURS)
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

  async function handleCreate() {
    setSubmitting(true)
    setError(null)
    try {
      const startedAt = Date.now()
      console.log("[CreateGameModal] handleCreate start", {
        name: name.trim(),
        description: description.trim(),
        durationHours,
      })
      const currentUserId = await db.getCurrentUserId()
      if (!currentUserId) {
        setError("Please sign in to create a game.")
        console.warn("[CreateGameModal] No authenticated user")
        return
      }
      if (!name.trim()) {
        setError("Name is required")
        console.warn("[CreateGameModal] Missing name input")
        return
      }
      console.log("[CreateGameModal] Calling createGameHost", {
        durationHours,
      })
      const game = await db.createGameHost({
        name: name.trim(),
        description: description.trim() || undefined,
        durationHours,
      })
      const elapsedMs = Date.now() - startedAt
      if (!game) {
        console.warn("[CreateGameModal] createGameHost returned null", { elapsedMs })
        setError("Failed to create game. Please try again.")
        return
      }
      console.log("[CreateGameModal] Game created", { id: game.id, elapsedMs })
      onCreated?.(game.id as number)
      sheetRef.current?.dismiss()
      resetForm()
    } catch (e: unknown) {
      console.error("[CreateGameModal] handleCreate error", e)
      setError(errorMessage(e) || "An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

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
      // Taller than the space above the keyboard: stop below the status bar and scroll.
      topInset={insets.top}
    >
      <BottomSheetScrollView contentContainerStyle={$sheet} keyboardShouldPersistTaps="handled">
        <View style={$headerRow}>
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            disabled={submitting}
            hitSlop={14}
            accessibilityRole="button"
          >
            <Text style={themed($cancelLink)} text="Cancel" />
          </Pressable>
          <Text preset="label" text="New file" />
        </View>

        <Text preset="display" text="Open an operation" style={$title} />

        <View style={$fields}>
          <TextField
            label="Operation name"
            value={name}
            onChangeText={setName}
            autoFocus
            InputComponent={SheetTextInput}
          />

          <TextField
            label="Briefing · optional"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            InputComponent={SheetTextInput}
          />

          <View style={$durationField}>
            <Text preset="label" text="Duration" />
            <Segmented
              options={DURATION_OPTIONS}
              value={durationHours}
              onChange={setDurationHours}
            />
          </View>
        </View>

        <View style={$footer}>
          {!!error && <Text preset="meta" text={error} style={themed($errorText)} />}
          <Text
            preset="meta"
            text="You’re the host. We’ll issue a six-character file number to share with your agents."
          />
          <Button
            preset="filled"
            text={submitting ? "Issuing…" : "Issue file number"}
            onPress={handleCreate}
            disabled={submitting || !name.trim()}
          />
        </View>
      </BottomSheetScrollView>
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

const $cancelLink: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.medium,
  fontSize: 13,
  lineHeight: 16,
  letterSpacing: 0.8,
  color: colors.red,
})

const $title: TextStyle = {
  marginTop: 10,
}

const $fields: ViewStyle = {
  gap: 24,
  marginTop: 26,
}

const $durationField: ViewStyle = {
  gap: 8,
}

const $footer: ViewStyle = {
  gap: 16,
  marginTop: "auto",
  paddingTop: 24,
}

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.red,
})
