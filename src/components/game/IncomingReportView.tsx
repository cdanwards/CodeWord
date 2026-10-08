import { useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { AgentPhoto } from "@/components/ui/AgentPhoto"
import { Rule } from "@/components/ui/Rule"
import { Sheet } from "@/components/ui/Sheet"
import { TopBar } from "@/components/ui/TopBar"
import { db } from "@/lib/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { GameViewProps } from "./types"

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

const HEADLINE_SIZE = 86

/**
 * Frame 11: someone filed a kill report against you. Confirm it (you're out, they inherit your
 * target and words) or dispute it (the report is voided).
 */
export function IncomingReportView({ mission, onChanged }: GameViewProps) {
  const { themed } = useAppTheme()
  const [busy, setBusy] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  const report = mission.incoming
  if (!report) return null

  const killerFirstName = report.killerName.trim().split(/\s+/)[0] || report.killerName

  const respond = async (confirmed: boolean) => {
    if (busy) return
    setBusy(true)
    setError(null)
    const trimmed = note.trim()
    const result = await db.respondToElimination({
      eliminationId: report.eliminationId,
      confirmed,
      note: !confirmed && trimmed ? trimmed : undefined,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    onChanged()
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$content}>
      <TopBar left="back" label={`Incoming report · ${timeAgo(report.occurredAt)}`} />

      <Text preset="display" style={themed($headline)} text="You've been made." />

      <Sheet style={$sheet}>
        <View style={$reporter}>
          <AgentPhoto name={report.killerName} width={40} />
          <Text preset="copy" style={$reporterCopy}>
            <Text preset="bold" text={report.killerName} /> reports getting you to say
          </Text>
        </View>
        <Text preset="heading" style={$word} text={report.word} />
        {!!report.notes && (
          <>
            <Rule dashed style={$rule} />
            <Text preset="meta" style={themed($inkMeta)} text={`“${report.notes}”`} />
          </>
        )}
      </Sheet>

      <View style={$actions}>
        <Text
          preset="meta"
          style={$consequence}
          text={`Confirming takes you out and hands ${killerFirstName} your target and your words.`}
        />
        <Button
          preset="filled"
          text="Confirm — I said it"
          disabled={busy}
          onPress={() => respond(true)}
        />
        {disputing ? (
          <>
            <TextField
              label="Why? · optional"
              value={note}
              onChangeText={setNote}
              editable={!busy}
              containerStyle={$field}
            />
            <Button
              preset="danger"
              text="Send dispute"
              disabled={busy}
              onPress={() => respond(false)}
            />
          </>
        ) : (
          <Button
            preset="danger"
            text="Dispute"
            disabled={busy}
            onPress={() => setDisputing(true)}
          />
        )}
        {!!error && <Text preset="meta" style={themed($error)} text={error} />}
      </View>
    </Screen>
  )
}

const $content: ViewStyle = { flexGrow: 1, paddingHorizontal: 22 }

const $headline: ThemedStyle<TextStyle> = ({ colors }) => ({
  marginTop: 18,
  fontSize: HEADLINE_SIZE,
  lineHeight: Math.round(HEADLINE_SIZE * 0.98),
  color: colors.red,
})

const $sheet: ViewStyle = { marginTop: 22 }

const $reporter: ViewStyle = { flexDirection: "row", alignItems: "center", gap: 12 }

const $reporterCopy: TextStyle = { flex: 1 }

const $word: TextStyle = { marginTop: 14 }

const $rule: ViewStyle = { marginTop: 14, marginBottom: 12 }

const $inkMeta: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink })

const $actions: ViewStyle = { marginTop: "auto", paddingTop: 28, paddingBottom: 12, gap: 8 }

const $consequence: TextStyle = { marginBottom: 6 }

const $field: ViewStyle = { marginTop: 8, marginBottom: 4 }

const $error: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.red, marginTop: 4 })
