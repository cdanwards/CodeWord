import { Fragment, useMemo } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { useRouter } from "expo-router"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Rule } from "@/components/ui/Rule"
import { Sheet } from "@/components/ui/Sheet"
import { Stamp } from "@/components/ui/Stamp"
import { TopBar } from "@/components/ui/TopBar"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { GameViewProps } from "./types"
import type { BoardMember } from "../../../supabase/schema"

/** "71h 40m" between two ISO timestamps, or null when either is missing. */
function durationLabel(startedAt: string | null, endedAt: string | null) {
  if (!startedAt || !endedAt) return null
  const minutes = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000)
  if (!Number.isFinite(minutes) || minutes < 0) return null
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

function timeOf(iso: string | null) {
  return iso ? new Date(iso).getTime() : 0
}

/** Survivors first, then most eliminations, then whoever lasted longer. */
function byStanding(a: BoardMember, b: BoardMember) {
  const survivedA = a.status === "active" ? 0 : 1
  const survivedB = b.status === "active" ? 0 : 1
  if (survivedA !== survivedB) return survivedA - survivedB
  if (a.eliminations !== b.eliminations) return b.eliminations - a.eliminations
  return timeOf(b.eliminatedAt) - timeOf(a.eliminatedAt)
}

/**
 * Frame 13: the operation is over. Shows the winner (or why it closed) and the final standings.
 */
export function DebriefView({ mission, board }: GameViewProps) {
  const router = useRouter()
  const { themed, theme } = useAppTheme()
  const { game, winner } = mission

  const standings = useMemo(() => [...board.members].sort(byStanding), [board.members])
  const duration = durationLabel(game.startedAt, game.endedAt)
  const winnerKills = winner
    ? (board.members.find((member) => member.userId === winner.userId)?.eliminations ?? 0)
    : 0
  const survivors = board.members.filter((member) => member.status === "active").length

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      backgroundColor={theme.colors.manila}
      contentContainerStyle={$content}
    >
      <TopBar
        left="back"
        label={duration ? `Operation closed · ${duration}` : "Operation closed"}
      />
      <Text preset="display" text="Debrief" style={$title} />

      <Sheet style={$sheet}>
        {winner ? (
          <>
            <Text preset="label" text="Last agent standing" />
            <Text preset="heading" text={winner.fullName} style={[$sheetHeading, $clearStamp]} />
            <Text preset="meta" text={plural(winnerKills, "elimination")} style={$sheetMeta} />
            <Stamp text="Winner" rotate={7} style={$stamp} />
          </>
        ) : (
          <>
            <Text preset="label" text="Operation closed" />
            <Text
              preset="heading"
              text={game.completionReason === "time_up" ? "Time's up" : "Called off"}
              style={$sheetHeading}
            />
            <Text
              preset="meta"
              text={`${plural(survivors, "agent")} survived`}
              style={$sheetMeta}
            />
          </>
        )}
      </Sheet>

      <Text preset="label" text="Final standings" style={[themed($inkText), $standingsLabel]} />
      <View style={$standings}>
        {standings.map((member, index) => {
          const isMe = member.userId === mission.me.userId
          return (
            <Fragment key={member.userId}>
              {index > 0 && <Rule />}
              <View style={$row}>
                <Text
                  preset="mono"
                  style={[themed($rank), index === 0 && themed($redText)]}
                  text={String(index + 1).padStart(2, "0")}
                />
                <Text preset="copy" style={[themed($inkText), $name]} numberOfLines={1}>
                  {member.fullName}
                  {isMe && <Text preset="copy" text=" (you)" />}
                </Text>
                <Text preset="meta" style={themed($inkText)} text={String(member.eliminations)} />
              </View>
            </Fragment>
          )
        })}
      </View>

      <View style={$footer}>
        <Button
          preset="filled"
          text="Back to HQ"
          onPress={() => router.replace("/(app)/(tabs)/home")}
        />
      </View>
    </Screen>
  )
}

const $content: ViewStyle = {
  flexGrow: 1,
  paddingHorizontal: 22,
  paddingBottom: 24,
}

const $title: TextStyle = {
  marginTop: 8,
}

const $sheet: ViewStyle = {
  marginTop: 16,
}

const $sheetHeading: TextStyle = {
  marginTop: 8,
}

// Keeps a long winner name clear of the stamp.
const $clearStamp: TextStyle = {
  paddingRight: 84,
}

const $sheetMeta: TextStyle = {
  marginTop: 8,
}

const $stamp: ViewStyle = {
  position: "absolute",
  right: 14,
  top: 16,
}

const $inkText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink })
const $redText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.red })

const $standingsLabel: TextStyle = {
  marginTop: 22,
}

const $standings: ViewStyle = {
  marginTop: 6,
}

const $row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  minHeight: 42,
}

const $rank: ThemedStyle<TextStyle> = ({ colors }) => ({
  width: 22,
  color: colors.ink,
})

const $name: TextStyle = {
  flex: 1,
}

// Pinned to the bottom on short rosters; 28 below the standings on long ones.
const $footer: ViewStyle = {
  flexGrow: 1,
  justifyContent: "flex-end",
  paddingTop: 28,
}
