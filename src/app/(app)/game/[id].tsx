import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { View, FlatList, Alert } from "react-native"
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router"

import { Button } from "@/components/Button"
import { EliminationConfirmationModal } from "@/components/EliminationConfirmationModal"
import { EliminationHistory } from "@/components/EliminationHistory"
import { Screen } from "@/components/Screen"
import { TargetCard } from "@/components/TargetCard"
import { Text } from "@/components/Text"
import { Spacer } from "@/components/ui/Spacer"
import { db } from "@/lib/database"

import type {
  Game,
  UserGame,
  GameWord,
  Elimination,
  EliminationConfirmation,
} from "../../../../supabase/schema"

type UserGameWithGame = UserGame & {
  games: Game
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const navigation = useNavigation()
  const [game, setGame] = useState<Game | null>(null)
  const [members, setMembers] = useState<UserGameWithGame[]>([])
  const [words, setWords] = useState<GameWord[]>([])
  const [eliminations, setEliminations] = useState<Elimination[]>([])
  const [eliminationRounds, setEliminationRounds] = useState<
    { round: number; eliminations: Elimination[] }[]
  >([])
  const [currentTarget, setCurrentTarget] = useState<UserGame | null>(null)
  const [pendingConfirmations, setPendingConfirmations] = useState<EliminationConfirmation[]>([])
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [selectedConfirmation, setSelectedConfirmation] = useState<EliminationConfirmation | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const loadGameDetails = useCallback(async () => {
    if (!id) return

    try {
      const gameId = parseInt(id, 10)
      if (isNaN(gameId)) {
        console.error("Invalid game ID:", id)
        return
      }

      // Get current user ID
      const userId = await db.getCurrentUserId()
      setCurrentUserId(userId)

      // Load game details
      const gameData = await db.getGame(gameId)
      if (!gameData) {
        console.error("Game not found:", gameId)
        return
      }
      setGame(gameData)

      // Load game members
      const gameMembers = await db.getGameMembers(gameId)
      setMembers(gameMembers as UserGameWithGame[])

      // Load game words
      const gameWords = await db.listGameWords(gameId)
      setWords(gameWords)

      // Load eliminations and rounds
      const eliminationHistory = await db.getGameEliminationHistory(gameId)
      setEliminations(eliminationHistory.eliminations)
      setEliminationRounds(eliminationHistory.rounds)

      // Load current target if game is active
      if (gameData.status === "active" && userId) {
        const target = await db.getMyTarget(gameId, userId)
        setCurrentTarget(target)
      }

      // Load pending confirmations
      if (userId) {
        const confirmations = await db.getPendingConfirmations(userId)
        setPendingConfirmations(confirmations)

        // Show confirmation modal if there are pending confirmations
        if (confirmations.length > 0) {
          setSelectedConfirmation(confirmations[0])
          setShowConfirmationModal(true)
        }
      }
    } catch (error) {
      console.error("Error loading game details:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    loadGameDetails()
  }, [loadGameDetails, id])

  useLayoutEffect(() => {
    navigation.setOptions({ title: game?.name ?? "Game" })
  }, [navigation, game?.name])

  const handleTargetEliminated = useCallback(() => {
    // Refresh game data after target elimination
    loadGameDetails()
  }, [loadGameDetails])

  const handleEliminationConfirmed = useCallback(() => {
    setShowConfirmationModal(false)
    setSelectedConfirmation(null)
    // Refresh game data after elimination confirmation
    loadGameDetails()
  }, [loadGameDetails])

  const handleStartGame = async () => {
    if (!game) return

    try {
      const success = await db.startGame(game.id)
      if (success) {
        Alert.alert("Game Started", "The game is now active! Targets have been assigned.", [
          { text: "OK", onPress: loadGameDetails },
        ])
      } else {
        Alert.alert("Error", "Failed to start the game. Please try again.")
      }
    } catch (error) {
      console.error("Error starting game:", error)
      Alert.alert("Error", "An unexpected error occurred while starting the game.")
    }
  }

  const handleEndGame = async () => {
    if (!game) return

    Alert.alert(
      "End Game?",
      "Are you sure you want to end this game? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Game",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await db.endGame(game.id, "manual_end")
              if (success) {
                // Calculate final results
                await db.calculateGameResults(game.id)
                Alert.alert("Game Ended", "The game has been ended and results calculated.", [
                  { text: "View Results", onPress: loadGameDetails },
                ])
              } else {
                Alert.alert("Error", "Failed to end the game. Please try again.")
              }
            } catch (error) {
              console.error("Error ending game:", error)
              Alert.alert("Error", "An unexpected error occurred while ending the game.")
            }
          },
        },
      ],
    )
  }

  function renderMember({ item }: { item: UserGameWithGame }) {
    return (
      <View style={$memberItem}>
        <Text preset="default" text={item.games.name} />
        <Text preset="formHelper" text={`Role: ${item.role}`} style={$memberRole} />
        {item.status === "eliminated" && (
          <Text preset="formHelper" text="ELIMINATED" style={$eliminatedText} />
        )}
      </View>
    )
  }

  function renderWord({ item }: { item: GameWord }) {
    return (
      <View style={$wordItem}>
        <Text preset="default" text={item.word} />
        <Text preset="formHelper" text={`Day ${item.dayNumber}`} style={$wordDay} />
      </View>
    )
  }

  if (loading) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} style={$screen}>
        <View style={$contentContainer}>
          <Text preset="default">Loading game...</Text>
        </View>
      </Screen>
    )
  }

  if (!game) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} style={$screen}>
        <View style={$contentContainer}>
          <Text preset="default">Game not found</Text>
          <Spacer size={16} />
          <Button text="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    )
  }

  const isHost = currentUserId === game.hostUserId
  const isActiveGame = game.status === "active"

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} style={$screen}>
      <View style={$contentContainer}>
        <Text preset="heading" text={game.name} />
        {game.description && (
          <Text preset="formHelper" text={game.description} style={$gameDescription} />
        )}
        <Text preset="formHelper" text={`Code: ${game.code}`} style={$gameCode} />
        <Text preset="formHelper" text={`Status: ${game.status}`} style={$gameStatus} />

        <Spacer size={24} />

        {/* Game Controls */}
        {isHost && game.status === "lobby" && (
          <>
            <Button text="Start Game" onPress={handleStartGame} style={$startButton} />
            <Spacer size={16} />
          </>
        )}

        {isHost && isActiveGame && (
          <>
            <Button text="End Game" onPress={handleEndGame} style={$endButton} />
            <Spacer size={16} />
          </>
        )}

        {/* Target Card - only show in active games */}
        {isActiveGame && currentUserId && (
          <>
            <TargetCard
              gameId={game.id}
              currentUserId={currentUserId}
              target={currentTarget}
              onTargetEliminated={handleTargetEliminated}
            />
            <Spacer size={16} />
          </>
        )}

        {/* Elimination History */}
        <EliminationHistory eliminations={eliminations} rounds={eliminationRounds} />

        <Spacer size={24} />

        <Text preset="subheading" text="Members" />
        <Spacer size={12} />
        {members.length === 0 ? (
          <Text preset="formHelper" text="No members found" style={$emptyText} />
        ) : (
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => `${item.userId}-${item.gameId}`}
            style={$membersList}
            scrollEnabled={false}
          />
        )}

        <Spacer size={24} />

        <Text preset="subheading" text="Words" />
        <Spacer size={12} />
        {words.length === 0 ? (
          <Text preset="formHelper" text="No words found" style={$emptyText} />
        ) : (
          <FlatList
            data={words}
            renderItem={renderWord}
            keyExtractor={(item) => `${item.gameId}-${item.id}`}
            style={$wordsList}
            scrollEnabled={false}
          />
        )}

        <Spacer size={24} />
        <Button text="Go Back" onPress={() => router.back()} />
      </View>

      {/* Elimination Confirmation Modal */}
      <EliminationConfirmationModal
        visible={showConfirmationModal}
        confirmation={selectedConfirmation}
        onClose={() => {
          setShowConfirmationModal(false)
          setSelectedConfirmation(null)
        }}
        onConfirmed={handleEliminationConfirmed}
      />
    </Screen>
  )
}

const $screen = {
  flex: 1,
}

const $contentContainer = {
  padding: 24,
}

const $gameDescription = {
  marginTop: 8,
  color: "#666",
}

const $gameCode = {
  marginTop: 4,
  fontFamily: "monospace",
  color: "#007AFF",
}

const $gameStatus = {
  marginTop: 4,
  color: "#666",
  textTransform: "capitalize" as const,
}

const $startButton = {
  backgroundColor: "#28a745",
}

const $endButton = {
  backgroundColor: "#dc3545",
}

const $membersList = {
  flex: 1,
}

const $wordsList = {
  flex: 1,
}

const $memberItem = {
  backgroundColor: "#f5f5f5",
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
}

const $memberRole = {
  marginTop: 4,
  color: "#666",
  textTransform: "capitalize" as const,
}

const $eliminatedText = {
  marginTop: 4,
  color: "#dc3545",
  fontWeight: "bold" as const,
}

const $wordItem = {
  backgroundColor: "#f5f5f5",
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
}

const $wordDay = {
  marginTop: 4,
  color: "#666",
}

const $emptyText = {
  color: "#999",
  fontStyle: "italic" as const,
}
