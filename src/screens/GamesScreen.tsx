import { useCallback, useEffect, useState } from "react"
import { View, FlatList, TouchableOpacity, ViewStyle } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { CreateGameModal } from "@/components/CreateGameModal"
import { JoinGameModal } from "@/components/JoinGameModal"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Spacer } from "@/components/ui/Spacer"
import { db } from "@/lib/database"
import { runNetworkTests } from "@/lib/network-test"
import { networkManager } from "@/lib/network-utils"
import { useAuth } from "@/stores"

import type { UserGame, Game } from "../../supabase/schema"

// Type for UserGame with joined game data
type UserGameWithGame = UserGame & {
  games: Game
}

export function GamesScreen() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [createVisible, setCreateVisible] = useState(false)
  const [joinVisible, setJoinVisible] = useState(false)
  const [games, setGames] = useState<UserGameWithGame[]>([])
  const [loading, setLoading] = useState(true)

  const loadGames = useCallback(async () => {
    console.log("=== loadGames function called ===")
    try {
      console.log("Auth state:", { isAuthenticated, userId: user?.id })

      const userId = user?.id
      if (!userId) {
        console.log("No authenticated user found")
        setGames([])
        setLoading(false)
        return
      }

      // Run network tests for debugging (non-blocking in dev only)
      if (__DEV__) {
        runNetworkTests().catch(() => {})
      }

      // Check network status
      const networkStatus = networkManager.getStatus()
      console.log("Network status:", networkStatus)

      // Load games with network fallback
      const userGames = await db.getUserGames(userId)
      console.log("Loaded games:", userGames.length)

      // Type assertion since getUserGames returns UserGameWithGame[] from the join
      setGames(userGames as UserGameWithGame[])
    } catch (error) {
      console.error("Error loading games:", error)
      setGames([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    loadGames()
  }, [loadGames])

  const handleGameCreated = (_gameId: number) => {
    // Optimistically refresh the games list
    loadGames()
  }

  const handleGameJoined = (_gameId: number) => {
    // Optimistically refresh the games list
    loadGames()
  }

  function renderGame({ item }: { item: UserGameWithGame }) {
    const game = item.games
    if (!game) return null

    return (
      <TouchableOpacity style={$gameItem} onPress={() => router.push(`/game/${game.id}`)}>
        <Text preset="subheading" text={game.name} />
        {game.description && (
          <Text preset="formHelper" text={game.description} style={$gameDescription} />
        )}
        <Text preset="formHelper" text={`Code: ${game.code}`} style={$gameCode} />
        <Text preset="formHelper" text={`Role: ${item.role}`} style={$gameRole} />
      </TouchableOpacity>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} style={$screen}>
      <View style={$contentContainer}>
        <View>
          <Text preset="heading">Your Games</Text>
          <Spacer size={16} />
        </View>

        <View style={$body}>
          <View style={$gamesListContainer}>
            <FlatList
              data={games}
              renderItem={renderGame}
              keyExtractor={(item: any) =>
                `${item.userId ?? item.user_id}-${item.gameId ?? item.game_id}`
              }
              style={$gamesList}
              contentContainerStyle={$gamesListContent}
              ListEmptyComponent={
                <Text style={$emptyListText}>{loading ? "Loading..." : "No games yet"}</Text>
              }
            />
            <View style={$buttonContainer}>
              <Spacer size={16} />
              <Button text="Create Game" onPress={() => setCreateVisible(true)} />
              <Spacer size={12} />
              <Button text="Enter Game Code" onPress={() => setJoinVisible(true)} />
            </View>
          </View>
        </View>
      </View>

      <CreateGameModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={handleGameCreated}
      />
      <JoinGameModal
        visible={joinVisible}
        onClose={() => setJoinVisible(false)}
        onJoined={handleGameJoined}
      />
    </Screen>
  )
}

const $screen = {
  flex: 1,
}

const $contentContainer = {
  padding: 24,
  flex: 1,
}

const $body = {
  flex: 1,
}

const $gamesList = {
  flex: 1,
}

const $buttonContainer = {
  marginTop: 16,
}

const $gamesListContainer: ViewStyle = {
  flex: 1,
}

const $gamesListContent = {
  paddingBottom: 16,
}

const $gameItem = {
  backgroundColor: "#f5f5f5",
  padding: 16,
  borderRadius: 8,
  marginBottom: 12,
}

const $gameDescription = {
  marginTop: 4,
  color: "#666",
}

const $gameCode = {
  marginTop: 4,
  fontFamily: "monospace",
  color: "#007AFF",
}

const $gameRole = {
  marginTop: 4,
  color: "#666",
  textTransform: "capitalize" as const,
}

const $emptyListText = {
  color: "#666",
  fontSize: 16,
}
