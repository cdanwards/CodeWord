import { useCallback, useEffect, useMemo, useState } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { CreateGameButton } from "@/components/ui/CreateGameButton"
import { EnterCodeButton } from "@/components/ui/EnterCodeButton"
import { Spacer } from "@/components/ui/Spacer"
import { StatusPill } from "@/components/ui/StatusPill"
import { db } from "@/lib/database"
import { useAuth } from "@/stores"

type UserGameWithGame = {
  games: {
    id: number
    name: string
    description?: string | null
    status?: string | null
    code?: string | null
  }
}

export function HomeScreen() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [userGames, setUserGames] = useState<UserGameWithGame[]>([])
  const [_loading, setLoading] = useState(false)

  const activeGame = useMemo(() => {
    return userGames.find((ug) => (ug.games?.status as any) === "active")?.games
  }, [userGames])

  const loadUserGames = useCallback(async () => {
    try {
      setLoading(true)
      const userId = user?.id
      if (!userId) {
        setUserGames([])
        return
      }
      const results = await db.getUserGames(userId)
      setUserGames((results as any) || [])
    } catch {
      setUserGames([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadUserGames()
  }, [loadUserGames])

  function handleGameCreated(_gameId: number) {
    loadUserGames()
  }

  function handleGameJoined(_gameId: number) {
    loadUserGames()
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      style={$screen}
      contentContainerStyle={$contentContainer}
    >
      {isAuthenticated && user ? (
        <>
          <Text preset="subheading" style={$welcomeText}>
            Welcome back, {user.name}!
          </Text>
          <Spacer size={8} />
          <Text preset="meta" style={$emailText}>
            Ready for your next assignment?
          </Text>
          <Spacer size={24} />
        </>
      ) : (
        <>
          <Text preset="heading" style={$welcomeText}>
            Welcome to Codeword!
          </Text>
          <Spacer size={24} />
        </>
      )}

      {!!activeGame && (
        <>
          <Card
            onPress={() => router.push(`/game/${activeGame.id}`)}
            HeadingComponent={
              <View style={$rowBetween}>
                <Text weight="bold" size="lg" text={activeGame.name} />
                <StatusPill
                  variant={
                    (activeGame.status as any) === "active"
                      ? "active"
                      : (activeGame.status as any) === "ended"
                        ? "ended"
                        : "waiting"
                  }
                />
              </View>
            }
            ContentComponent={
              <View>
                {!!activeGame.description && <Text preset="meta" text={activeGame.description} />}
                <Spacer size={12} />
                <Button text="Resume Game" onPress={() => router.push(`/game/${activeGame.id}`)} />
              </View>
            }
          />
          <Spacer size={20} />
        </>
      )}

      <EnterCodeButton onJoined={handleGameJoined} />
      <Spacer size={12} />
      <CreateGameButton onCreated={handleGameCreated} />

      <Spacer size={16} />
      <Button text="View all games" onPress={() => router.push("/games")} />
    </Screen>
  )
}

const $screen: ViewStyle = {
  flex: 1,
  flexGrow: 1,
  backgroundColor: "red",
}

const $contentContainer: ViewStyle = {
  justifyContent: "flex-start" as const,
  alignItems: "stretch" as const,
  padding: 24,
}

const $welcomeText: TextStyle = {
  textAlign: "left",
  marginBottom: 8,
}

const $emailText: TextStyle = {
  textAlign: "left",
  opacity: 0.7,
}

const $rowBetween: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

// cta buttons are full-width via their own styles
