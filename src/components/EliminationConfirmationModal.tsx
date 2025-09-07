import React, { useState } from "react"
import { View, Modal, Alert } from "react-native"
import { Text } from "./Text"
import { Button } from "./Button"
import { TextField } from "./TextField"
import { Spacer } from "./ui/Spacer"
import { db } from "@/lib/database"
import type { EliminationConfirmation } from "../../../supabase/schema"

interface EliminationConfirmationModalProps {
  visible: boolean
  confirmation: EliminationConfirmation | null
  onClose: () => void
  onConfirmed: () => void
}

export function EliminationConfirmationModal({
  visible,
  confirmation,
  onClose,
  onConfirmed,
}: EliminationConfirmationModalProps) {
  const [notes, setNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  if (!confirmation || !confirmation.eliminations) {
    return null
  }

  const elimination = confirmation.eliminations

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      const success = await db.confirmElimination({
        eliminationId: confirmation.eliminationId,
        targetUserId: confirmation.targetUserId,
        confirmed: true,
        notes,
      })

      if (success) {
        Alert.alert("Elimination Confirmed", "You have been eliminated from the game.", [
          { text: "OK", onPress: onConfirmed },
        ])
      } else {
        Alert.alert("Error", "Failed to confirm elimination. Please try again.")
      }
    } catch (error) {
      console.error("Error confirming elimination:", error)
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert(
        "Rejection Reason Required",
        "Please provide a reason for rejecting this elimination.",
      )
      return
    }

    setIsProcessing(true)
    try {
      const success = await db.confirmElimination({
        eliminationId: confirmation.eliminationId,
        targetUserId: confirmation.targetUserId,
        confirmed: false,
        rejectionReason,
      })

      if (success) {
        Alert.alert("Elimination Rejected", "You have rejected this elimination request.", [
          { text: "OK", onPress: onClose },
        ])
      } else {
        Alert.alert("Error", "Failed to reject elimination. Please try again.")
      }
    } catch (error) {
      console.error("Error rejecting elimination:", error)
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={$modalOverlay}>
        <View style={$modalContent}>
          <Text preset="heading" text="Elimination Request" />
          <Spacer size={16} />

          <View style={$eliminationInfo}>
            <Text preset="default" text="You have been targeted for elimination!" />
            <Spacer size={8} />
            <Text preset="formHelper" text={`Game: ${elimination.gameId}`} />
            {elimination.notes && (
              <>
                <Spacer size={8} />
                <Text preset="formHelper" text={`Notes: ${elimination.notes}`} />
              </>
            )}
            {elimination.eliminationMethod && (
              <>
                <Spacer size={8} />
                <Text preset="formHelper" text={`Method: ${elimination.eliminationMethod}`} />
              </>
            )}
          </View>

          <Spacer size={16} />

          <Text preset="subheading" text="Confirm or Reject" />
          <Spacer size={12} />

          <TextField
            label="Your Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional context..."
            multiline
            numberOfLines={3}
          />

          <Spacer size={16} />

          <TextField
            label="Rejection Reason (if rejecting)"
            value={rejectionReason}
            onChangeText={setRejectionReason}
            placeholder="Why are you rejecting this elimination?"
            multiline
            numberOfLines={3}
          />

          <Spacer size={24} />

          <View style={$buttonRow}>
            <Button
              text="Reject"
              onPress={handleReject}
              disabled={isProcessing}
              style={$rejectButton}
            />
            <Spacer size={12} />
            <Button
              text="Confirm Elimination"
              onPress={handleConfirm}
              disabled={isProcessing}
              style={$confirmButton}
            />
          </View>

          <Spacer size={16} />

          <Button text="Close" onPress={onClose} preset="secondary" />
        </View>
      </View>
    </Modal>
  )
}

const $modalOverlay = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
}

const $modalContent = {
  backgroundColor: "white",
  borderRadius: 16,
  padding: 24,
  margin: 20,
  maxWidth: 400,
  width: "100%",
}

const $eliminationInfo = {
  backgroundColor: "#fff3cd",
  borderColor: "#ffeaa7",
  borderWidth: 1,
  borderRadius: 8,
  padding: 16,
}

const $buttonRow = {
  flexDirection: "row" as const,
  justifyContent: "space-between",
}

const $rejectButton = {
  flex: 1,
  backgroundColor: "#6c757d",
}

const $confirmButton = {
  flex: 1,
  backgroundColor: "#dc3545",
}

