import { Fragment } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AgentPhoto } from "@/components/ui/AgentPhoto"
import { Redaction } from "@/components/ui/Redaction"
import { Rule } from "@/components/ui/Rule"
import { Sheet } from "@/components/ui/Sheet"
import { Stamp } from "@/components/ui/Stamp"
import { TopBar } from "@/components/ui/TopBar"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { GameViewProps } from "./types"
import type { FeedEntry } from "../../../supabase/schema"

const DAY_MS = 24 * 60 * 60 * 1000

/** "just now", "2m ago", "5h ago", "1d ago" */
function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms)) return ""
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** "Day 2 · 14:32", or just "14:32" when the start time is unknown. */
function dayStamp(iso: string | null, startedAt: string | null) {
  if (!iso) return null
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return null
  const time = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`
  const start = startedAt ? new Date(startedAt).getTime() : NaN
  if (!Number.isFinite(start)) return time
  const day = Math.max(1, Math.floor((at.getTime() - start) / DAY_MS) + 1)
  return `Day ${day} · ${time}`
}

/**
 * Frame 12: you're out. Your own file, stamped, and the intel feed so the operation stays
 * watchable.
 */
export function EliminatedView({ mission, board }: GameViewProps) {
  const { themed } = useAppTheme()
  const { game, me, eliminatedBy } = mission
  const myName = board.members.find((m) => m.userId === me.userId)?.fullName ?? "Agent"
  const when = dayStamp(me.eliminatedAt ?? eliminatedBy?.occurredAt ?? null, game.startedAt)
  const feed = [...board.feed].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$content}>
      <TopBar left="back" label={`Op. ${game.name}`} />

      <Sheet style={$sheet}>
        <View style={$file}>
          <AgentPhoto width={88} height={108} caption="Your photo" />
          <View style={$fileText}>
            <Text preset="label" text="Agent" />
            <Text preset="heading" style={themed($name)} text={myName} />
            {!!when && <Text preset="meta" style={$when} text={when} />}
          </View>
        </View>
        <Stamp
          size="lg"
          text={me.status === "left" ? "Withdrawn" : "Eliminated"}
          rotate={-6}
          style={$stamp}
        />
      </Sheet>

      <Text preset="meta" style={$byline}>
        {eliminatedBy ? (
          <>
            By {eliminatedBy.killerName} with{" "}
            <Text preset="meta" style={themed($inkMeta)} text={eliminatedBy.word.toUpperCase()} />
            .{" "}
          </>
        ) : null}
        The operation continues without you.
      </Text>

      <View style={$feedHeader}>
        <Text preset="label" style={themed($inkLabel)} text="Intel feed" />
        <Text preset="label" text={`${mission.agentsLeft} of ${mission.agentsTotal} left`} />
      </View>

      <View style={$feed}>
        {feed.length === 0 ? (
          <Text preset="copy" style={$feedEmpty} text="No other eliminations yet." />
        ) : (
          feed.map((entry, index) => (
            <Fragment key={entry.eliminationId}>
              {index > 0 && <Rule />}
              <FeedRow entry={entry} myUserId={me.userId} />
            </Fragment>
          ))
        )}
      </View>
    </Screen>
  )
}

function FeedRow({ entry, myUserId }: { entry: FeedEntry; myUserId: string }) {
  const { themed } = useAppTheme()
  const killerIsMe = entry.killerUserId === myUserId
  const victimIsMe = entry.victimUserId === myUserId

  return (
    <View style={$row}>
      <Text preset="copy" style={themed($inkCopy)}>
        {killerIsMe ? <Text preset="bold" text="You" /> : entry.killerName} eliminated{" "}
        {victimIsMe ? <Text preset="bold" text="you" /> : entry.victimName}
      </Text>
      <View style={$rowMeta}>
        {entry.word ? (
          <Text preset="meta" text={entry.word.toUpperCase()} />
        ) : (
          <Redaction width={60} height={11} />
        )}
        <Text preset="meta" text={`· ${timeAgo(entry.occurredAt)}`} />
      </View>
    </View>
  )
}

const $content: ViewStyle = { paddingHorizontal: 22, paddingBottom: 24 }

// Bottom padding keeps the stamp off the name; the stamp sits across the lower band.
const $sheet: ViewStyle = {
  marginTop: 14,
  padding: 14,
  paddingBottom: 106, // room for the rotated stamp below the text
  position: "relative",
  overflow: "hidden",
}

const $file: ViewStyle = { flexDirection: "row", gap: 16 }

const $fileText: ViewStyle = { flex: 1, minWidth: 0 }

const NAME_SIZE = 36

const $name: ThemedStyle<TextStyle> = ({ colors }) => ({
  marginTop: 6,
  fontSize: NAME_SIZE,
  lineHeight: Math.round(NAME_SIZE * 0.98),
  color: colors.ink2,
})

const $when: TextStyle = { marginTop: "auto", paddingTop: 8 }

const $stamp: ViewStyle = { position: "absolute", left: 22, bottom: 14 }

const $byline: TextStyle = { marginTop: 14 }

const $inkMeta: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink })

const $feedHeader: ViewStyle = {
  marginTop: 26,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $inkLabel: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink })

const $feed: ViewStyle = { marginTop: 6 }

const $feedEmpty: TextStyle = { paddingVertical: 12 }

const $row: ViewStyle = { paddingVertical: 12, gap: 4 }

const $inkCopy: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink })

const $rowMeta: ViewStyle = { flexDirection: "row", alignItems: "center", gap: 6 }
