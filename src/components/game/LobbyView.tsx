import { Fragment, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AgentPhoto } from "@/components/ui/AgentPhoto"
import { Chip } from "@/components/ui/Chip"
import { Rule } from "@/components/ui/Rule"
import { Stamp } from "@/components/ui/Stamp"
import { TopBar } from "@/components/ui/TopBar"
import { db } from "@/lib/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { copyToClipboard, shareCode } from "@/utils/share"

import type { GameViewProps } from "./types"

const MIN_AGENTS = 2

/** "just now", "2m ago", "1h ago", "3d ago" */
function joinedAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (!Number.isFinite(minutes) || minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * Frame 08: the operation's lobby. Everyone sees the file number and roster; only the host can
 * start the operation, once at least two agents are in.
 */
export function LobbyView({ mission, board, onChanged }: GameViewProps) {
  const { themed } = useAppTheme()
  const { game } = mission
  const isHost = mission.me.userId === game.hostUserId
  const members = board.members
  const canStart = members.length >= MIN_AGENTS

  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const ok = await copyToClipboard(`#${game.code}`)
    setCopied(ok)
  }

  async function handleStart() {
    setStarting(true)
    setError(null)
    const result = await db.startGame(game.id)
    setStarting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    onChanged()
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$content}>
      <TopBar left="back" right={<Stamp text="Waiting" tone="ink" rotate={3} />} />
      <Text preset="heading" text={game.name} style={$title} />

      <View style={themed($fileBox)}>
        <View>
          <Text preset="label" text="File no." />
          <Text style={themed($code)} text={game.code} />
        </View>
        <View style={$chips}>
          <Chip small label={copied ? "Copied" : "Copy"} onPress={handleCopy} />
          <Chip small selected label="Share" onPress={() => shareCode(game.code)} />
        </View>
      </View>

      <View style={$sectionHeader}>
        <Text
          preset="label"
          style={themed($inkLabel)}
          text={`Roster · ${members.length} ${members.length === 1 ? "agent" : "agents"}`}
        />
        <Text preset="label" text={`Min. ${MIN_AGENTS}`} />
      </View>
      <View style={$roster}>
        {members.map((member, index) => {
          const memberIsHost = member.userId === game.hostUserId
          return (
            <Fragment key={member.userId}>
              {index > 0 && <Rule />}
              <View style={$row}>
                <AgentPhoto name={member.fullName} width={34} />
                <Text
                  preset="copy"
                  style={[themed($inkText), $name]}
                  text={member.fullName}
                  numberOfLines={1}
                />
                <Text
                  preset="meta"
                  style={memberIsHost ? themed($redText) : undefined}
                  text={memberIsHost ? "Host" : joinedAgo(member.joinedAt)}
                />
              </View>
            </Fragment>
          )
        })}
      </View>

      <Text preset="label" style={[themed($inkLabel), $codewordsLabel]} text="Codewords" />
      <Text
        preset="copy"
        style={$codewordsCopy}
        text="Codewords are issued daily from the bank: hard on day 1, easier each day after."
      />

      <View style={$footer}>
        {isHost ? (
          <>
            <Button
              preset="primary"
              text={starting ? "Starting…" : "Start operation"}
              disabled={!canStart || starting}
              onPress={handleStart}
            />
            <Text
              preset="meta"
              style={$centered}
              text="Targets are assigned at random. No take-backs."
            />
            {!!error && <Text preset="meta" style={[themed($redText), $centered]} text={error} />}
          </>
        ) : (
          <Text preset="copy" style={$centered} text="Waiting for the host to start." />
        )}
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

const $fileBox: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 16,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderWidth: 1.5,
  borderStyle: "dashed",
  borderColor: colors.ruleStrong,
  borderRadius: 6,
})

const $code: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.mono.semiBold,
  fontSize: 30,
  lineHeight: 36,
  letterSpacing: 5,
  color: colors.ink,
  marginTop: 4,
})

const $chips: ViewStyle = {
  flexDirection: "row",
  gap: 8,
}

const $sectionHeader: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 22,
}

const $inkLabel: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink })
const $inkText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.ink })
const $redText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.red })

const $roster: ViewStyle = {
  marginTop: 6,
}

const $row: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  minHeight: 50,
}

const $name: TextStyle = {
  flex: 1,
}

const $codewordsLabel: TextStyle = {
  marginTop: 18,
}

const $codewordsCopy: TextStyle = {
  marginTop: 8,
}

const $footer: ViewStyle = {
  marginTop: "auto",
  paddingTop: 28,
  gap: 8,
}

const $centered: TextStyle = {
  textAlign: "center",
}
