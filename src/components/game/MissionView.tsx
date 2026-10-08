import { useState } from "react"
import { Alert, Pressable, TextStyle, useWindowDimensions, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AgentPhoto } from "@/components/ui/AgentPhoto"
import { Redaction } from "@/components/ui/Redaction"
import { Rule } from "@/components/ui/Rule"
import { Sheet } from "@/components/ui/Sheet"
import { Stamp } from "@/components/ui/Stamp"
import { TopBar } from "@/components/ui/TopBar"
import { db } from "@/lib/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { ReportSheet } from "./ReportSheet"
import type { GameViewProps } from "./types"
import type { Mission, MissionWord } from "../../../supabase/schema"

const SCREEN_PADDING = 22
const SHEET_PADDING = 14
const HOUR_MS = 60 * 60 * 1000

function clockLine(game: Mission["game"]) {
  const day = `Day ${game.day} of ${game.daysTotal}`
  if (!game.endsAt) return day
  const ms = new Date(game.endsAt).getTime() - Date.now()
  if (!Number.isFinite(ms)) return day
  if (ms <= 0) return `${day} · time up`
  return `${day} · ${ms < HOUR_MS ? "<1" : Math.floor(ms / HOUR_MS)}h left`
}

/** "Bob Martinez" → "Bob M." */
function shortName(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]
}

function wordTag(word: MissionWord) {
  return word.inheritedFromName
    ? `From ${shortName(word.inheritedFromName)}`
    : `Day ${word.grantedDay}`
}

/**
 * 09 Your target: the night-time hero screen. Your codewords stay redacted until you hold the
 * reveal control, so nobody reads them over your shoulder. Files the kill report (frame 10).
 */
export function MissionView({ mission, onChanged }: GameViewProps) {
  const { themed, theme } = useAppTheme()
  const { width } = useWindowDimensions()
  const [revealed, setRevealed] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  const { game, target, words, outgoing } = mission
  const isHost = mission.me.userId === game.hostUserId
  const photoWidth = width - SCREEN_PADDING * 2 - SHEET_PADDING * 2

  function confirmEnd() {
    Alert.alert(
      "End operation?",
      "This closes the operation for every agent and goes straight to the debrief.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End operation", style: "destructive", onPress: endOperation },
      ],
    )
  }

  async function endOperation() {
    setEnding(true)
    setEndError(null)
    try {
      const result = await db.endGame(game.id)
      if (result.ok) onChanged()
      else setEndError(result.message)
    } finally {
      setEnding(false)
    }
  }

  return (
    <Screen
      preset="scroll"
      backgroundColor={theme.colors.night}
      systemBarStyle="light"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$content}
      ScrollViewProps={{ showsVerticalScrollIndicator: false }}
    >
      <TopBar left="back" night label={`Op. ${game.name} · Day ${game.day}`} />

      <View style={$targetRow}>
        <Text preset="label" text="Your target" style={themed($redText)} />
        <Text preset="mono" text={clockLine(game)} style={themed($clock)} />
      </View>

      {target ? (
        <Sheet style={$sheet}>
          <AgentPhoto caption="Target photo" width={photoWidth} height={200} />
          <View style={$nameRow}>
            <Text
              preset="heading"
              text={target.fullName.trim().replace(/\s+/, "\n")}
              style={$name}
            />
            <Stamp text="Active" style={$stamp} />
          </View>
          <Rule dashed style={$dash} />
          <Text
            preset="label"
            text={`Make them say any of · ${words.length} ${words.length === 1 ? "word" : "words"}`}
          />
          {words.length === 0 ? (
            <Text preset="meta" text="No codewords issued yet." style={$wordsEmpty} />
          ) : (
            <>
              <View style={$words}>
                {words.map((w) =>
                  revealed ? (
                    <View key={w.word} style={$wordRow}>
                      <Text text={w.word} style={themed($word)} numberOfLines={1} />
                      <Text preset="meta" text={wordTag(w)} />
                    </View>
                  ) : (
                    <View key={w.word} style={$wordRow}>
                      <Redaction width={Math.min(200, 36 + w.word.length * 12)} height={15} />
                    </View>
                  ),
                )}
              </View>
              <Pressable
                onPressIn={() => setRevealed(true)}
                onPressOut={() => setRevealed(false)}
                accessibilityRole="button"
                accessibilityLabel="Hold to reveal your codewords"
                style={themed($hold)}
              >
                <Text
                  preset="mono"
                  text={revealed ? "RELEASE TO HIDE" : "HOLD TO REVEAL"}
                  style={themed($holdText)}
                />
                <Text
                  preset="mono"
                  text={`${words.length} ${words.length === 1 ? "WORD" : "WORDS"}`}
                  style={themed($holdText)}
                />
              </Pressable>
            </>
          )}
        </Sheet>
      ) : (
        <Text preset="copy" text="No target assigned yet." style={themed($noTarget)} />
      )}

      {outgoing ? (
        <Sheet style={$notice}>
          <Text preset="label" text="Report filed" />
          <Text
            preset="copy"
            text={`Waiting for ${outgoing.victimName} to confirm.`}
            style={$noticeCopy}
          />
        </Sheet>
      ) : (
        <Button
          preset="primary"
          text="Report elimination"
          onPress={() => setReporting(true)}
          disabled={!target || words.length === 0}
          style={$report}
        />
      )}

      <View style={$footer}>
        <View style={$agentsRow}>
          <Text
            preset="label"
            text={`${mission.agentsLeft} of ${mission.agentsTotal} agents left`}
            style={themed($nightLabel)}
          />
          <View style={$pips}>
            {Array.from({ length: mission.agentsTotal }, (_, i) =>
              i < mission.agentsLeft ? (
                <View key={i} style={themed($pipOn)} />
              ) : (
                <View key={i} style={themed($pipOut)}>
                  <View style={themed($pipSlash)} />
                </View>
              ),
            )}
          </View>
        </View>

        {isHost && (
          <View style={$endBlock}>
            <Pressable
              onPress={confirmEnd}
              disabled={ending}
              hitSlop={10}
              accessibilityRole="button"
              style={$endLink}
            >
              <Text
                preset="label"
                text={ending ? "Ending operation…" : "End operation"}
                style={themed($redText)}
              />
            </Pressable>
            {!!endError && <Text preset="meta" text={endError} style={themed($redText)} />}
          </View>
        )}
      </View>

      {target && (
        <ReportSheet
          visible={reporting}
          mission={mission}
          onClose={() => setReporting(false)}
          onFiled={onChanged}
        />
      )}
    </Screen>
  )
}

const $content: ViewStyle = { flexGrow: 1, paddingHorizontal: SCREEN_PADDING }

const $targetRow: ViewStyle = {
  marginTop: 10,
  flexDirection: "row",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
}

const $redText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.red })

const $clock: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  lineHeight: 18,
  color: colors.onNight,
})

const $sheet: ViewStyle = { marginTop: 12, padding: SHEET_PADDING, borderWidth: 0 }

const $nameRow: ViewStyle = {
  marginTop: 14,
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
}

const $name: TextStyle = { flex: 1 }

const $stamp: ViewStyle = { marginTop: 4 }

const $dash: ViewStyle = { marginTop: 14, marginBottom: 12 }

const $wordsEmpty: TextStyle = { marginTop: 8 }

const $words: ViewStyle = { marginTop: 10, gap: 4 }

const $wordRow: ViewStyle = {
  height: 30,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
}

const $word: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  flexShrink: 1,
  fontFamily: typography.mono.medium,
  fontSize: 17,
  lineHeight: 22,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: colors.ink,
})

const $hold: ThemedStyle<ViewStyle> = ({ colors }) => ({
  marginTop: 12,
  height: 46,
  borderRadius: 3,
  backgroundColor: colors.ink,
  paddingHorizontal: 14,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $holdText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  lineHeight: 16,
  letterSpacing: 1.7,
  color: colors.onNight2,
})

const $noTarget: ThemedStyle<TextStyle> = ({ colors }) => ({
  marginTop: 16,
  color: colors.onNight2,
})

const $notice: ViewStyle = { marginTop: 16, borderWidth: 0 }

const $noticeCopy: TextStyle = { marginTop: 6 }

const $report: ViewStyle = { marginTop: 16 }

const $footer: ViewStyle = { marginTop: "auto", paddingTop: 28, paddingBottom: 30 }

const $agentsRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
}

const $nightLabel: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.onNight2 })

const $pips: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 4,
  flexShrink: 1,
}

const $pipOn: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 10,
  height: 10,
  backgroundColor: colors.onNight,
})

const $pipOut: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 10,
  height: 10,
  borderWidth: 1.5,
  borderColor: colors.red,
  overflow: "hidden",
  alignItems: "center",
  justifyContent: "center",
})

const $pipSlash: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 14,
  height: 1.5,
  backgroundColor: colors.red,
  transform: [{ rotate: "-45deg" }],
})

const $endBlock: ViewStyle = { marginTop: 28, alignItems: "center", gap: 6 }

const $endLink: ViewStyle = { paddingVertical: 4 }
