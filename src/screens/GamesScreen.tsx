import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, TextStyle, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Chip } from "@/components/ui/Chip"
import { Folder } from "@/components/ui/Folder"
import { StatusPill, StatusVariant } from "@/components/ui/StatusPill"
import { TopBar } from "@/components/ui/TopBar"
import { db } from "@/lib/database"
import { runNetworkTests } from "@/lib/network-test"
import { networkManager } from "@/lib/network-utils"
import { useAuth } from "@/stores"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { copyToClipboard, shareCode } from "@/utils/share"

import type { Game, UserGameWithGame } from "../../supabase/schema"

type GameRow = UserGameWithGame & { games: Game }

type Filter = "all" | StatusVariant

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Waiting", value: "waiting" },
  { label: "Closed", value: "ended" },
]

/** lobby → Waiting, active → Active, ended/finished/canceled → Closed. */
function statusVariantFor(status: string): StatusVariant {
  if (status === "active") return "active"
  if (status === "ended" || status === "finished" || status === "canceled") return "ended"
  return "waiting"
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

/** Meta line from data we already have: role, the player's own status, and timing. */
function metaFor(item: GameRow, variant: StatusVariant) {
  const game = item.games
  const parts: string[] = []
  if (item.role) parts.push(capitalize(item.role))
  if (item.status === "eliminated") parts.push("Eliminated")

  if (variant === "active" && game.startedAt) {
    const endsAt = new Date(game.startedAt).getTime() + game.durationHours * 3_600_000
    const hoursLeft = Math.ceil((endsAt - Date.now()) / 3_600_000)
    if (hoursLeft > 0) parts.push(`ends in ${hoursLeft}h`)
  } else if (variant === "waiting") {
    parts.push(`${game.durationHours}h operation`)
  }

  return parts.join(" · ")
}

export function GamesScreen() {
  const router = useRouter()
  const { themed } = useAppTheme()
  const { isAuthenticated, user } = useAuth()
  const [games, setGames] = useState<UserGameWithGame[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")

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

      setGames(userGames)
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

  const files = useMemo(() => games.filter((item): item is GameRow => !!item.games), [games])

  const visibleFiles = useMemo(
    () =>
      filter === "all"
        ? files
        : files.filter((item) => statusVariantFor(item.games.status) === filter),
    [files, filter],
  )

  function renderGame({ item }: { item: GameRow }) {
    const game = item.games
    const variant = statusVariantFor(game.status)
    const closed = variant === "ended"
    const meta = metaFor(item, variant)

    return (
      <Folder
        tab={`No. ${game.code}`}
        closed={closed}
        onPress={() => router.push(`/game/${game.id}`)}
      >
        <StatusPill variant={variant} style={$stamp} />
        <Text preset="title" text={game.name} style={[$gameName, closed && themed($closedName)]} />
        {!!meta && <Text preset="meta" text={meta} style={$meta} />}
        {!closed && (
          <View style={$actions}>
            <Chip small label="Copy code" onPress={() => copyToClipboard(`#${game.code}`)} />
            <Chip small label="Share" onPress={() => shareCode(game.code)} />
          </View>
        )}
      </Folder>
    )
  }

  const emptyText = loading
    ? "Pulling files…"
    : files.length === 0
      ? "No case files yet."
      : "No files match this filter."

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} style={$screen}>
      <View style={$content}>
        <FlatList
          data={visibleFiles}
          renderItem={renderGame}
          keyExtractor={(item) => `${item.userId}-${item.gameId}`}
          style={$list}
          contentContainerStyle={$listContent}
          ItemSeparatorComponent={FolderGap}
          ListHeaderComponent={
            <View style={$header}>
              <TopBar
                left="back"
                label={`${files.length} ${files.length === 1 ? "file" : "files"}`}
              />
              <Text preset="display" text="Case files" style={$title} />
              <View style={$filters}>
                {FILTERS.map((option) => (
                  <Chip
                    key={option.value}
                    small
                    label={option.label}
                    selected={filter === option.value}
                    onPress={() => setFilter(option.value)}
                  />
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={<Text preset="copy" text={emptyText} style={$emptyText} />}
        />
      </View>
    </Screen>
  )
}

function FolderGap() {
  return <View style={$folderGap} />
}

const $screen: ViewStyle = {
  flex: 1,
}

const $content: ViewStyle = {
  flex: 1,
  paddingHorizontal: 22,
}

const $list: ViewStyle = {
  flex: 1,
}

const $listContent: ViewStyle = {
  paddingTop: 8,
  paddingBottom: 32,
}

// The design leaves 48px between the filters and the first folder body; the folder's tab
// (FOLDER_TAB_HEIGHT, 26) fills part of that.
const $header: ViewStyle = {
  paddingBottom: 22,
}

const $title: TextStyle = {
  marginTop: 10,
}

const $filters: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 18,
}

// 18 + the next folder's 26px tab = 44px between folder bodies, as in the design.
const $folderGap: ViewStyle = {
  height: 18,
}

const $stamp: ViewStyle = {
  position: "absolute",
  top: 14,
  right: 14,
}

// Keeps long names clear of the status stamp.
const $gameName: TextStyle = {
  paddingRight: 96,
}

const $closedName: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.ink2,
})

const $meta: TextStyle = {
  marginTop: 8,
}

const $actions: ViewStyle = {
  flexDirection: "row",
  gap: 8,
  marginTop: 14,
}

const $emptyText: TextStyle = {
  marginTop: 8,
}
