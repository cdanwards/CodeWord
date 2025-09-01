import { useCallback, useEffect, useState } from "react"
import { View, FlatList, ViewStyle } from "react-native"
import { useRouter } from "expo-router"

import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { IconButton } from "@/components/ui/IconButton"
import { Spacer } from "@/components/ui/Spacer"
import { StatusPill } from "@/components/ui/StatusPill"
import { db } from "@/lib/database"
import { runNetworkTests } from "@/lib/network-test"
import { networkManager } from "@/lib/network-utils"
import { useAuth } from "@/stores"
import { copyToClipboard, shareCode } from "@/utils/share"

import type { UserGame, Game } from "../../supabase/schema"

// Type for UserGame with joined game data
type UserGameWithGame = UserGame & {
  games: Game
}

export function GamesScreen() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
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

  function renderGame({ item }: { item: UserGameWithGame }) {
    const game = item.games
    if (!game) return null

    const statusVariant =
      (game.status as any) === "active"
        ? "active"
        : (game.status as any) === "ended"
          ? "ended"
          : "waiting"

    return (
      <Card
        onPress={() => router.push(`/game/${game.id}`)}
        HeadingComponent={
          <View style={$rowBetween}>
            <Text weight="bold" size="lg" text={game.name} />
            <StatusPill variant={statusVariant} />
          </View>
        }
        ContentComponent={
          <View>
            {!!game.description && <Text preset="meta" text={game.description} />}
            <View style={$rowMeta}>
              <Text preset="meta" text={`Code: #${game.code}`} />
              <View style={$rowActions}>
                <IconButton icon="copy" onPress={() => copyToClipboard(`#${game.code}`)} />
                <IconButton icon="share" onPress={() => shareCode(game.code)} />
              </View>
            </View>
            <Text preset="meta" text={`Role: ${item.role?.toLowerCase()}`} />
          </View>
        }
      />
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
            <View style={$buttonContainer} />
          </View>
        </View>
      </View>
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

// Deprecated local styles retained for reference during refactor; not used with Card layout

const $emptyListText = {
  color: "#666",
  fontSize: 16,
}

const $rowBetween = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  justifyContent: "space-between" as const,
}
const $rowMeta = { flexDirection: "row" as const, alignItems: "center" as const, marginTop: 4 }
const $rowActions = { flexDirection: "row" as const, marginLeft: 8, gap: 8 }
