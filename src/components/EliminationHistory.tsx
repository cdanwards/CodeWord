import React from "react"
import { View, FlatList } from "react-native"
import { Text } from "./Text"
import { Card } from "./Card"
import { Spacer } from "./ui/Spacer"
import type { Elimination } from "../../../supabase/schema"

interface EliminationHistoryProps {
  eliminations: Elimination[]
  rounds: { round: number; eliminations: Elimination[] }[]
}

export function EliminationHistory({ eliminations, rounds }: EliminationHistoryProps) {
  if (eliminations.length === 0) {
    return (
      <Card style={$historyCard}>
        <Text preset="subheading" text="Elimination History" />
        <Spacer size={12} />
        <Text preset="formHelper" text="No eliminations yet. The game is just getting started!" />
      </Card>
    )
  }

  const renderElimination = ({ item }: { item: Elimination }) => (
    <View style={$eliminationItem}>
      <View style={$eliminationHeader}>
        <Text preset="default" text={`Round ${item.eliminationRound || 1}`} />
        <Text preset="formHelper" text={new Date(item.occurredAt).toLocaleDateString()} />
      </View>

      <View style={$eliminationDetails}>
        <Text preset="formHelper" text={`${item.killerUserId} eliminated ${item.victimUserId}`} />
        {item.notes && <Text preset="formHelper" text={`Notes: ${item.notes}`} />}
        {item.eliminationMethod && (
          <Text preset="formHelper" text={`Method: ${item.eliminationMethod}`} />
        )}
        <Text
          preset="formHelper"
          text={`Status: ${item.confirmationStatus}`}
          style={$statusText(item.confirmationStatus)}
        />
      </View>
    </View>
  )

  const renderRound = ({ item }: { item: { round: number; eliminations: Elimination[] } }) => (
    <View style={$roundSection}>
      <Text preset="subheading" text={`Round ${item.round}`} style={$roundTitle} />
      <Spacer size={8} />
      {item.eliminations.map((elimination, index) => (
        <View key={elimination.id} style={$roundElimination}>
          <Text
            preset="default"
            text={`${elimination.killerUserId} → ${elimination.victimUserId}`}
          />
          {elimination.notes && <Text preset="formHelper" text={elimination.notes} />}
          <Text
            preset="formHelper"
            text={elimination.confirmationStatus}
            style={$statusText(elimination.confirmationStatus)}
          />
        </View>
      ))}
    </View>
  )

  return (
    <Card style={$historyCard}>
      <Text preset="subheading" text="Elimination History" />
      <Spacer size={16} />

      {rounds.length > 0 ? (
        <FlatList
          data={rounds}
          renderItem={renderRound}
          keyExtractor={(item) => `round-${item.round}`}
          scrollEnabled={false}
          style={$roundsList}
        />
      ) : (
        <FlatList
          data={eliminations}
          renderItem={renderElimination}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          style={$eliminationsList}
        />
      )}
    </Card>
  )
}

const $historyCard = {
  marginBottom: 16,
}

const $roundsList = {
  flex: 1,
}

const $eliminationsList = {
  flex: 1,
}

const $roundSection = {
  marginBottom: 16,
}

const $roundTitle = {
  fontWeight: "bold" as const,
  color: "#007AFF",
}

const $roundElimination = {
  backgroundColor: "#f8f9fa",
  padding: 8,
  borderRadius: 6,
  marginBottom: 8,
  marginLeft: 16,
}

const $eliminationItem = {
  backgroundColor: "#f8f9fa",
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
}

const $eliminationHeader = {
  flexDirection: "row" as const,
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
}

const $eliminationDetails = {
  gap: 4,
}

const $statusText = (status: string) => ({
  fontWeight: "bold" as const,
  color:
    status === "confirmed"
      ? "#28a745"
      : status === "rejected"
        ? "#dc3545"
        : status === "expired"
          ? "#6c757d"
          : "#ffc107",
})

