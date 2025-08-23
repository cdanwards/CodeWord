import { useCallback, useEffect, useState } from "react"
import { View, FlatList } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Spacer } from "@/components/ui/Spacer"
import { db } from "@/lib/database"

import type { Game, UserGame, GameWord } from "../../../../supabase/schema"

type UserGameWithGame = UserGame & {
  games: Game
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [members, setMembers] = useState<UserGameWithGame[]>([])
  const [words, setWords] = useState<GameWord[]>([])
  const [loading, setLoading] = useState(true)

  const loadGameDetails = useCallback(async () => {
    if (!id) return

    try {
      const gameId = parseInt(id, 10)
      if (isNaN(gameId)) {
        console.error("Invalid game ID:", id)
        return
      }

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

  function renderMember({ item }: { item: UserGameWithGame }) {
    return (
      <View style={$memberItem}>
        <Text preset="default" text={item.games.name} />
        <Text preset="formHelper" text={`Role: ${item.role}`} style={$memberRole} />
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
