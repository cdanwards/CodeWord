import React, { useState } from "react"
import { View, Alert } from "react-native"
import { Text } from "./Text"
import { Button } from "./Button"
import { Card } from "./Card"
import { Spacer } from "./ui/Spacer"
import { db } from "@/lib/database"
import type { UserGame } from "../../../supabase/schema"

interface TargetCardProps {
  gameId: number
  currentUserId: string
  target: UserGame | null
  onTargetEliminated: () => void
}

export function TargetCard({ gameId, currentUserId, target, onTargetEliminated }: TargetCardProps) {
  const [isEliminating, setIsEliminating] = useState(false)

  const handleEliminateTarget = async () => {
    if (!target) return

    Alert.alert(
      "Eliminate Target?",
      `Are you sure you want to eliminate ${target.games?.name || "your target"}? This action requires their confirmation.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Eliminate",
          style: "destructive",
          onPress: async () => {
            setIsEliminating(true)
            try {
              const success = await db.attemptElimination({
                gameId,
                killerUserId: currentUserId,
                targetUserId: target.userId,
                notes: "Elimination attempted",
              })

              if (success) {
                Alert.alert(
                  "Elimination Requested",
                  "Your elimination request has been sent to your target. They must confirm the elimination for it to be recorded.",
                  [{ text: "OK", onPress: onTargetEliminated }],
                )
              } else {
                Alert.alert("Error", "Failed to request elimination. Please try again.")
              }
            } catch (error) {
              console.error("Error eliminating target:", error)
              Alert.alert("Error", "An unexpected error occurred. Please try again.")
            } finally {
              setIsEliminating(false)
            }
          },
        },
      ],
    )
  }

  if (!target) {
    return (
      <Card style={$targetCard}>
        <Text preset="subheading" text="Your Target" />
        <Spacer size={12} />
        <Text
          preset="formHelper"
          text="No target assigned yet. The game may not have started or targets are being reassigned."
        />
      </Card>
    )
  }

  return (
    <Card style={$targetCard}>
      <Text preset="subheading" text="Your Target" />
      <Spacer size={12} />

      <View style={$targetInfo}>
        <Text preset="default" text={target.games?.name || "Unknown Player"} />
        <Text preset="formHelper" text={`Role: ${target.role}`} />
        {target.games?.description && <Text preset="formHelper" text={target.games.description} />}
      </View>

      <Spacer size={16} />

      <Button
        text="Eliminate Target"
        onPress={handleEliminateTarget}
        disabled={isEliminating}
        style={$eliminateButton}
      />

      {isEliminating && (
        <Text preset="formHelper" text="Requesting elimination..." style={$loadingText} />
      )}
    </Card>
  )
}

const $targetCard = {
  marginBottom: 16,
}

const $targetInfo = {
  backgroundColor: "#f5f5f5",
  padding: 12,
  borderRadius: 8,
}

const $eliminateButton = {
  backgroundColor: "#dc3545",
}

const $loadingText = {
  textAlign: "center" as const,
  marginTop: 8,
  fontStyle: "italic" as const,
}

