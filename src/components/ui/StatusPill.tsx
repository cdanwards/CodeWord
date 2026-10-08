import { StyleProp, ViewStyle } from "react-native"

import { Stamp, StampTone } from "./Stamp"

export type StatusVariant = "waiting" | "active" | "ended"

export interface StatusPillProps {
  variant: StatusVariant
  label?: string
  style?: StyleProp<ViewStyle>
}

const toneByVariant: Record<StatusVariant, StampTone> = {
  waiting: "ink",
  active: "red",
  ended: "mute",
}

const labelByVariant: Record<StatusVariant, string> = {
  waiting: "Waiting",
  active: "Active",
  ended: "Closed",
}

/**
 * Game status as a rubber stamp.
 */
export function StatusPill({ variant, label, style }: StatusPillProps) {
  return (
    <Stamp
      text={label ?? labelByVariant[variant]}
      tone={toneByVariant[variant]}
      rotate={variant === "waiting" ? 4 : undefined}
      style={style}
    />
  )
}
