import { useEffect, useMemo, useRef, useState } from "react"
import { View } from "react-native"
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModal as BottomSheetModalType,
  BottomSheetView,
} from "@gorhom/bottom-sheet"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Spacer } from "@/components/ui/Spacer"
import { db } from "@/lib/database"

interface CreateGameModalProps {
  visible: boolean
  onClose: () => void
  onCreated?: (gameId: number) => void
}

export function CreateGameModal({ visible, onClose, onCreated }: CreateGameModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("72")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sheetRef = useRef<BottomSheetModalType>(null)
  const snapPoints = useMemo(() => ["65%"], [])

  // Reset form when modal closes
  const resetForm = () => {
    setName("")
    setDescription("")
    setDuration("72")
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
        duration,
      })
      const currentUserId = await db.getCurrentUserId()
      if (!currentUserId) {
        setError("Please sign in to create a game.")
        console.warn("[CreateGameModal] No authenticated user")
        return
      }
      const durationHours = Number(duration) || 72
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
    } catch (e: any) {
      console.error("[CreateGameModal] handleCreate error", e)
      setError(e?.message || "An error occurred")
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
      snapPoints={snapPoints}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      handleIndicatorStyle={$handleIndicator}
    >
      <BottomSheetView style={$sheet}>
        <View style={$content}>
          <Text preset="heading" text="Create Game" />
          <Spacer size={20} />

          <TextField
            label="Name"
            placeholder="Enter game name"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Spacer size={16} />

          <TextField
            label="Description"
            placeholder="Optional: Describe your game"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <Spacer size={16} />

          <TextField
            label="Duration (hours)"
            placeholder="72"
            keyboardType="number-pad"
            value={duration}
            onChangeText={setDuration}
          />

          <Spacer size={16} />
          {!!error && <Text preset="formHelper" text={error} style={$errorText} />}
          <Spacer size={16} />

          <View style={$row}>
            <Button
              text="Cancel"
              onPress={() => sheetRef.current?.dismiss()}
              disabled={submitting}
              style={$btnLeft}
            />
            <Button
              text="Create"
              onPress={handleCreate}
              disabled={submitting || !name.trim()}
              style={$btnRight}
            />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const $sheet = {
  flex: 1,
  paddingBottom: 64,
}

const $content = {
  padding: 16,
  flex: 1,
}

const $handleIndicator = {
  width: 40,
  height: 4,
  borderRadius: 2,
}

const $row = {
  flexDirection: "row" as const,
}

const $btnLeft = {
  flex: 1,
  marginRight: 8,
}

const $btnRight = {
  flex: 1,
  marginLeft: 8,
}

const $errorText = {
  color: "#D32F2F",
}
