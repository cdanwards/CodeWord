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

interface JoinGameModalProps {
  visible: boolean
  onClose: () => void
  onJoined?: (gameId: number) => void
}

export function JoinGameModal({ visible, onClose, onJoined }: JoinGameModalProps) {
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sheetRef = useRef<BottomSheetModalType>(null)
  const snapPoints = useMemo(() => ["50%"], [])

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
    } catch (e: any) {
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
          <Text preset="heading" text="Join Game" />
          <Spacer size={20} />

          <TextField
            label="Game Code"
            placeholder="Enter 6-character code"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
            autoFocus
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
              text="Join"
              onPress={handleJoin}
              disabled={submitting || !code.trim()}
              style={$btnRight}
            />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const $sheet = {
  backgroundColor: "#FF00FF", // Bright magenta background
  flex: 1,
}

const $content = {
  padding: 16,
  flex: 1,
  backgroundColor: "#00FFFF", // Bright cyan background
}

const $handleIndicator = {
  backgroundColor: "#E0E0E0",
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
