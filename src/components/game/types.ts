import type { Board, Mission } from "../../../supabase/schema"

/**
 * Props every game-state view receives from the game screen (src/app/(app)/game/[id].tsx).
 * The screen polls `db.getMission` and `db.getBoard`; call `onChanged` after any action so it
 * refreshes immediately instead of waiting for the next poll.
 */
export interface GameViewProps {
  mission: Mission
  board: Board
  onChanged: () => void
}
