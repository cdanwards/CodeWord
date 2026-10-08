import { useCallback, useEffect, useMemo, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { useFocusEffect, useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AgentPhoto } from "@/components/ui/AgentPhoto"
import { CreateGameButton } from "@/components/ui/CreateGameButton"
import { EnterCodeButton } from "@/components/ui/EnterCodeButton"
import { Folder } from "@/components/ui/Folder"
import { Redaction } from "@/components/ui/Redaction"
import { Rule } from "@/components/ui/Rule"
import { StatusPill, StatusVariant } from "@/components/ui/StatusPill"
import { TopBar } from "@/components/ui/TopBar"
import { db } from "@/lib/database"
import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { UserGameWithGame } from "../../supabase/schema"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "HQ · Thu 08 Oct" */
function hqDateLabel(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  return `HQ · ${WEEKDAYS[date.getDay()]} ${day} ${MONTHS[date.getMonth()]}`
}

function statusVariant(status: string | null | undefined): StatusVariant {
  if (status === "active") return "active"
  if (status === "ended") return "ended"
  return "waiting"
}

export function HomeScreen() {
  const router = useRouter()
  const { themed } = useAppTheme()
  const { user, isAuthenticated } = useAuth()

  const [userGames, setUserGames] = useState<UserGameWithGame[]>([])
  const [_loading, setLoading] = useState(false)
  // From the game engine once the featured operation is live.
  const [targetName, setTargetName] = useState<string | null>(null)
  const [playerCount, setPlayerCount] = useState<number | null>(null)

  // Feature the live operation; otherwise the newest one still in its lobby.
  // getUserGames is ordered newest first.
  const activeMembership = useMemo(() => {
    return (
      userGames.find((ug) => ug.games?.status === "active") ??
      userGames.find((ug) => ug.games?.status === "lobby")
    )
  }, [userGames])
  const activeGame = activeMembership?.games ?? null

  const loadUserGames = useCallback(async () => {
    try {
      setLoading(true)
      const userId = user?.id
      if (!userId) {
        setUserGames([])
        return
      }
      const results = await db.getUserGames(userId)
      setUserGames(results || [])
    } catch {
      setUserGames([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Reload whenever HQ comes back into view, e.g. after leaving a game.
  useFocusEffect(
    useCallback(() => {
      loadUserGames()
    }, [loadUserGames]),
  )

  const activeGameId = activeGame?.id
  useEffect(() => {
    setTargetName(null)
    setPlayerCount(null)
    if (!activeGameId) return

    let cancelled = false
    db.getMission(activeGameId).then((mission) => {
      if (cancelled || !mission) return
      setTargetName(mission.me.status === "active" ? (mission.target?.fullName ?? null) : null)
      setPlayerCount(mission.agentsTotal > 0 ? mission.agentsTotal : null)
    })
    return () => {
      cancelled = true
    }
  }, [activeGameId, userGames])

  function handleGameCreated(_gameId: number) {
    loadUserGames()
  }

  function handleGameJoined(_gameId: number) {
    loadUserGames()
  }

  const firstName = user?.name?.trim().split(/\s+/)[0]
  const openActiveGame = activeGame ? () => router.push(`/game/${activeGame.id}`) : undefined

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      style={$screen}
      contentContainerStyle={$contentContainer}
    >
      <TopBar
        left={<Text preset="label" text={hqDateLabel(new Date())} />}
        right={<Text preset="label" text="Codeword" />}
      />

      <Text preset="heading" style={$welcome}>
        {isAuthenticated && user
          ? `Welcome back, Agent${firstName ? ` ${firstName}` : ""}.`
          : "Welcome to Codeword."}
      </Text>

      {!!activeGame && (
        <View style={$folderWrap}>
          <Folder tab={`Op. ${activeGame.name}`} onPress={openActiveGame} style={$folder}>
            <StatusPill variant={statusVariant(activeGame.status)} style={$stamp} />

            <Text preset="label" text={targetName ? "Your target" : "Case file"} />
            {!!targetName && (
              <View style={$targetRow}>
                <AgentPhoto name={targetName} width={40} />
                <View style={$targetText}>
                  <Text preset="subheading" text={targetName} numberOfLines={1} />
                  <View style={$codewordRow}>
                    <Text preset="meta" text="Codeword" />
                    <Redaction width={84} />
                  </View>
                </View>
              </View>
            )}

            <Rule style={$folderRule} />

            <View style={$metaRow}>
              <Text preset="meta" text={`No. ${activeGame.code}`} />
              <Text
                preset="meta"
                style={themed($metaInk)}
                text={activeMembership?.role === "host" ? "Host" : "Agent"}
              />
            </View>
            <View style={$metaRow}>
              <Text
                preset="meta"
                text={
                  playerCount ? `${playerCount} agent${playerCount === 1 ? "" : "s"}` : "Duration"
                }
              />
              <Text preset="meta" style={themed($metaInk)} text={`${activeGame.durationHours}h`} />
            </View>

            <Button
              preset="primary"
              text={activeGame.status === "active" ? "Resume mission →" : "Open lobby →"}
              onPress={openActiveGame}
              style={$resume}
            />
          </Folder>
        </View>
      )}

      {userGames.length === 0 && (
        <Text
          preset="copy"
          style={$emptyCopy}
          text="No open files. Enter a code from your host or open an operation."
        />
      )}

      <View style={[$tiles, !activeGame && userGames.length > 0 && $tilesNoFolder]}>
        <EnterCodeButton onJoined={handleGameJoined} />
        <CreateGameButton onCreated={handleGameCreated} />
      </View>

      <Pressable
        onPress={() => router.push("/games")}
        accessibilityRole="button"
        style={({ pressed }) => [$row, pressed && $pressed]}
      >
        <Text
          preset="label"
          style={[themed($metaInk), $rowLabel]}
          text={`All case files · ${userGames.length}`}
        />
        <Text preset="mono" text="→" />
      </Pressable>
    </Screen>
  )
}

const $screen: ViewStyle = {
  flex: 1,
}

const $contentContainer: ViewStyle = {
  paddingHorizontal: 22,
  paddingTop: 8,
  paddingBottom: 24,
}

const $welcome: TextStyle = {
  marginTop: 12,
}

// The design leaves 52 above the folder body; Folder reserves the 26 of its tab itself.
const $folderWrap: ViewStyle = {
  marginTop: 26,
}

const $folder: ViewStyle = {
  paddingTop: 18,
}

const $stamp: ViewStyle = {
  position: "absolute",
  right: 14,
  top: 16,
}

const $targetRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  marginTop: 10,
}

const $targetText: ViewStyle = {
  flex: 1,
  minWidth: 0,
}

const $codewordRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  marginTop: 4,
}

const $folderRule: ViewStyle = {
  marginTop: 16,
  marginBottom: 12,
}

const $metaRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  gap: 12,
}

const $metaInk: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink })

const $resume: ViewStyle = {
  marginTop: 14,
}

const $emptyCopy: TextStyle = {
  marginTop: 28,
}

const $tiles: ViewStyle = {
  flexDirection: "row",
  gap: 12,
  marginTop: 16,
}

const $tilesNoFolder: ViewStyle = {
  marginTop: 28,
}

const $row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  minHeight: 56,
  marginTop: 8,
}

const $rowLabel: TextStyle = {
  flex: 1,
}

const $pressed: ViewStyle = {
  opacity: 0.6,
}
