import { useCallback, useState } from "react"
import { View, ViewStyle } from "react-native"
import { useFocusEffect, useLocalSearchParams } from "expo-router"

import { DebriefView } from "@/components/game/DebriefView"
import { EliminatedView } from "@/components/game/EliminatedView"
import { IncomingReportView } from "@/components/game/IncomingReportView"
import { LobbyView } from "@/components/game/LobbyView"
import { MissionView } from "@/components/game/MissionView"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TopBar } from "@/components/ui/TopBar"
import { db } from "@/lib/database"

import type { Board, Mission } from "../../../../supabase/schema"

// Other agents' moves (a report against you, a new target) arrive by polling while the screen
// is focused.
const POLL_MS = 8000

/**
 * One operation. Which view shows depends on the game and on you:
 * lobby → LobbyView; over → DebriefView; you're out → EliminatedView;
 * a report against you → IncomingReportView; otherwise → MissionView.
 */
export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const gameId = Number(id)
  const [mission, setMission] = useState<Mission | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [failed, setFailed] = useState(false)

  const refresh = useCallback(async () => {
    if (!Number.isFinite(gameId)) {
      setFailed(true)
      return
    }
    const [nextMission, nextBoard] = await Promise.all([db.getMission(gameId), db.getBoard(gameId)])
    if (!nextMission || !nextBoard) {
      setFailed(true)
      return
    }
    setFailed(false)
    setMission(nextMission)
    setBoard(nextBoard)
  }, [gameId])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, POLL_MS)
      return () => clearInterval(timer)
    }, [refresh]),
  )

  if (!mission || !board) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$placeholder}>
        <TopBar left="back" label="Case file" />
        <View style={$center}>
          <Text
            preset={failed ? "copy" : "label"}
            text={
              failed ? "This file couldn't be opened. Pull it again later." : "Pulling the file…"
            }
          />
        </View>
      </Screen>
    )
  }

  const props = { mission, board, onChanged: refresh }
  const { status } = mission.game

  if (status === "lobby") return <LobbyView {...props} />
  if (status === "ended" || status === "canceled") return <DebriefView {...props} />
  if (mission.me.status !== "active") return <EliminatedView {...props} />
  if (mission.incoming) return <IncomingReportView {...props} />
  return <MissionView {...props} />
}

const $placeholder: ViewStyle = { flex: 1, paddingHorizontal: 22 }
const $center: ViewStyle = { flex: 1, alignItems: "center", justifyContent: "center" }
