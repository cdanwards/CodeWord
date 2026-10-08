import { useEffect, useRef, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModal as BottomSheetModalType,
  BottomSheetView,
} from "@gorhom/bottom-sheet"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Chip } from "@/components/ui/Chip"
import { SheetTextInput } from "@/components/ui/SheetTextInput"
import { db } from "@/lib/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { Mission } from "../../../supabase/schema"

export interface ReportSheetProps {
  visible: boolean
  mission: Mission
  /** Called whenever the sheet goes away (filed, "Not yet", swipe down). */
  onClose: () => void
  /** Called after the report was filed, before the sheet closes. */
  onFiled: () => void
}

/**
 * 10 File the kill report: pick which of your codewords the target said, add an optional note,
 * and file it. The target then confirms or disputes.
 */
export function ReportSheet({ visible, mission, onClose, onFiled }: ReportSheetProps) {
  const { themed } = useAppTheme()
  const sheetRef = useRef<BottomSheetModalType>(null)
  const [word, setWord] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targetName = mission.target?.fullName ?? "Your target"
  const firstName = targetName.trim().split(/\s+/)[0] || targetName

  useEffect(() => {
    if (visible) sheetRef.current?.present()
    else sheetRef.current?.dismiss()
  }, [visible])

  const handleDismiss = () => {
    setWord(null)
    setNotes("")
    setError(null)
    onClose()
  }

  async function handleSubmit() {
    if (!word) return
    setSubmitting(true)
    setError(null)
    try {
      const trimmed = notes.trim()
      const result = await db.reportElimination({
        gameId: mission.game.id,
        word,
        notes: trimmed || undefined,
      })
      if (!result.ok) {
        setError(result.message)
        return
      }
      onFiled()
      sheetRef.current?.dismiss()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enablePanDownToClose={!submitting}
      onDismiss={handleDismiss}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      backgroundStyle={themed($sheetBackground)}
      handleIndicatorStyle={themed($handleIndicator)}
    >
      <BottomSheetView style={$sheet}>
        <View style={$headerRow}>
          <Text preset="label" text="Kill report · Form K-1" />
          <Text preset="label" text={`Day ${mission.game.day}`} />
        </View>

        <Text preset="copy" text={`Did ${targetName} say one of your words?`} style={$question} />

        {mission.words.length > 0 ? (
          <View style={$chips}>
            {mission.words.map((w) => (
              <Chip
                key={w.word}
                label={w.word}
                selected={word === w.word}
                onPress={() => setWord(word === w.word ? null : w.word)}
              />
            ))}
          </View>
        ) : (
          <Text preset="meta" text="No codewords issued yet." style={$noWords} />
        )}

        {!!word && (
          <Text
            preset="display"
            text={`${word}?`}
            style={themed($echo)}
            numberOfLines={1}
            adjustsFontSizeToFit
          />
        )}

        <TextField
          label="How you got them · optional"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          editable={!submitting}
          containerStyle={$notes}
          InputComponent={SheetTextInput}
        />

        <Text
          preset="meta"
          text={`${firstName} has to confirm. If they dispute it, the report is voided and ${firstName} stays your target.`}
          style={$rule}
        />
        {!!error && <Text preset="meta" text={error} style={themed($errorText)} />}

        <View style={$actions}>
          <Button
            preset="primary"
            text={submitting ? "Filing…" : "Submit report"}
            onPress={handleSubmit}
            disabled={!word || submitting}
          />
          <Button
            text="Not yet"
            onPress={() => sheetRef.current?.dismiss()}
            disabled={submitting}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const $sheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.paper,
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
})

const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.ruleStrong,
  width: 40,
  height: 5,
  borderRadius: 3,
})

// Content-sized (dynamic sizing), so no flex: 1 here.
const $sheet: ViewStyle = { paddingHorizontal: 22, paddingBottom: 34 }

const $headerRow: ViewStyle = {
  height: 44,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const $question: TextStyle = { marginTop: 8 }

const $chips: ViewStyle = { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 }

const $noWords: TextStyle = { marginTop: 14 }

const $echo: ThemedStyle<TextStyle> = ({ colors }) => ({ marginTop: 14, color: colors.red })

const $notes: ViewStyle = { marginTop: 20 }

const $rule: TextStyle = { marginTop: 14 }

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({ marginTop: 8, color: colors.red })

const $actions: ViewStyle = { marginTop: 20, gap: 8 }
