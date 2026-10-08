# Plan: "Spy dossier" redesign

Status: in progress (started 2026-10-08).

## Source of truth

Claude Design project **Codeword — Spy Dossier**: https://claude.ai/design/p/f8441953-4536-4df2-a45b-9369b8ad4c3e
(project id `f8441953-4536-4df2-a45b-9369b8ad4c3e`). Files:

- `dossier.css`: tokens and component styles (OKLCH; hex equivalents live in `src/theme/colors.ts`)
- `01 Access.dc.html`: 01 Sign in, 02 Enlist (sign up), 03 HQ (home), 04 Agent (profile)
- `02 Assemble.dc.html`: 05 Case files (games list), 06 Enter code (join), 07 New operation (create), 08 Lobby (host)
- `03 Mission.dc.html`: 09 Your target, 10 Kill report, 11 You've been made, 12 Eliminated, 13 Debrief

Each phone frame has a `data-screen-label` and a note under it explaining intent. Read them with
`mcp__claude_design__read_file` (the body comes back HTML-entity-escaped).

## Visual language

- Paper (`colors.paper`) screens, manila (`colors.manila`) folders, ink text, one accent: stamp red (`colors.red`).
- Only the sign-in cover and the active mission are dark (`colors.night`, text `colors.onNight` / `onNight2`).
- Type: condensed uppercase display (Barlow Condensed) for headlines/buttons/stamps; Archivo body;
  IBM Plex Mono for labels, metadata and codes. The design file renders the display face as
  condensed Archivo; Barlow Condensed is the closest face Expo can load. Treat them as the same.
- No icons or emoji: arrows are text (`←`, `→`, `×`), tab marks are squares.

## Design → code mapping

| Design (`dossier.css`) | Code |
|---|---|
| `.disp.d56` / `.d44` / `.d28`-`.d30` / `.d22` | `<Text preset="display" \| "heading" \| "title" \| "subheading">` |
| `.lbl` | `<Text preset="label">` (`formLabel` is the same) |
| `.meta` | `<Text preset="meta">` |
| `.copy` | `<Text preset="copy">` (`formHelper` is the same); `default` is ink body text |
| `.mono` | `<Text preset="mono">` |
| `.btn` / `.btn-red` / `.btn-ghost` / `.btn-ghost-red` / `.btn-paper` | `<Button preset="filled" \| "primary" \| "default" \| "danger" \| "paper">`; `ghostNight` = ghost on a night screen |
| `.stamp` (+ `-ink`, `-mute`, `-big`) | `<Stamp tone="red" \| "ink" \| "mute" size="sm" \| "lg">`; game status: `<StatusPill variant>` |
| `.folder` + `.folder-tab` | `<Folder tab="No. MDBZGU" closed? onPress?>` (reserves `FOLDER_TAB_HEIGHT` above itself) |
| `.sheet` | `<Sheet>` |
| `.rule` / `.rule-dash` | `<Rule />` / `<Rule dashed />` (`night`, `strong` variants) |
| `.redact` | `<Redaction width={84} />` |
| `.ph` / `.ph.av` | `<AgentPhoto caption="Target photo" width height />` / `<AgentPhoto name="Bob Martinez" width={40} />` |
| `.input` (underline) / `.area` | `<TextField label=...>` (underline by default, boxed when `multiline`; `tone="night"` on dark) |
| `.codebox` row | `<CodeBoxes value onChangeText />` |
| `.seg` row | `<Segmented options value onChange />` |
| `.chip` (+ `-on`, `-dash`, `-sm`) | `<Chip label selected dashed small onPress />` |
| `.topbar` | `<TopBar left="back" \| "close" label="..." right={...} night? />` |
| `.tabbar` | `src/app/(app)/(tabs)/_layout.tsx` (HQ / Agent) |

All live in `src/components/ui/` except Text/Button/TextField (`src/components/`).
Screen padding is 22 horizontal. Night screens: `<Screen backgroundColor={colors.night} systemBarStyle="light">`.

## Rules for implementers

- Presentation only: keep every data call, store call, navigation and validation as it is.
- Style with `ThemedStyle` + `themed()` like the rest of the codebase; use `theme.colors.*` tokens
  only (no new hex values). No `any`.
- Copy: follow the design's wording. Never assume a player's pronouns ("reports getting you to
  say", not "she got you to say").
- Show only real data. Where the design shows something the app can't load yet (target, codeword,
  agents-left counts before the game engine lands), render it only when the data exists.
- Verify with `yarn -s tsc --noEmit -p .` and `npx eslint <your files>`.

## Game views (frames 08–13)

The game screen `src/app/(app)/game/[id].tsx` polls `db.getMission(gameId)` and `db.getBoard(gameId)`
and renders exactly one view from `src/components/game/`, each taking `GameViewProps`
(`{ mission, board, onChanged }`, see `src/components/game/types.ts`). Data shapes: `Mission`,
`Board`, `BoardMember`, `FeedEntry`, `MissionWord` in `supabase/schema.ts`. Actions return
`ActionResult` (`{ ok: true, data } | { ok: false, message }`); show `message` to the user as a red
meta line, it is already readable ("That is not one of your codewords"). Call `onChanged()` after a
successful action.

| View | When | Frame |
|---|---|---|
| `LobbyView` | `game.status === "lobby"` | 08 |
| `MissionView` (+ its report sheet) | active game, you're active, no incoming report | 09, 10 |
| `IncomingReportView` | `mission.incoming` is set | 11 |
| `EliminatedView` | `mission.me.status !== "active"` | 12 |
| `DebriefView` | `game.status` is `ended` / `canceled` | 13 |

Game rules (they changed after the design was drawn, adapt the frames to them):

- Each agent holds **several** codewords (`mission.words`): one is issued per day from a shared
  bank, hard on day 1, medium on day 2, easy from day 3, and a kill hands you all of the victim's
  words (`inheritedFromName` is set on those). Getting your target to say ANY of your words counts.
  So frame 09's single "Make them say / HOLD TO REVEAL / 8 LETTERS" bar becomes a list: label
  "Make them say any of · N words", one redaction bar per word while hidden, and holding the
  "Hold to reveal" control shows the words (mono, uppercase) with a small meta tag per word:
  "Day 2" or "From Bob M.". Never reveal words without the hold.
- Frame 10's report sheet asks which word was said: show your words as selectable Chips
  (revealed, since you're filing the report), optional "How you got them" note, primary
  "Submit report". `mission.outgoing` set means a report is waiting: replace the
  "Report elimination" button with a paper notice "Report filed · waiting for <victimName> to confirm".
- Lobby (frame 08): there are no host-managed codewords any more. Replace that section with copy:
  "Codewords are issued daily from the bank: hard on day 1, easier each day after." Start needs
  2+ agents; non-hosts see "Waiting for the host to start." instead of the button.
- The kill feed (`board.feed`) only includes the word for the killer and the victim; when
  `word` is null render a `<Redaction>` in its place.
- Time: `game.day` / `game.daysTotal`, `game.endsAt` (ISO). A simple "Day 2 of 3 · 41h left" is
  enough; no ticking clock needed.
- The host is a player. Hosts also get a small red "End operation" link at the bottom of the
  mission view, with a confirmation Alert before calling `db.endGame`.

## Status

- [x] Foundation: fonts, palette, Text/Button/TextField presets, ui primitives, tab bar, stack header removed
- [x] Access: Login, Signup
- [x] HQ + Agent: Home (+ EnterCodeButton / CreateGameButton tiles), Profile
- [x] Case files: GamesScreen, JoinGameModal, CreateGameModal
- [x] Game engine (migration 005, `scripts/simulate-game.mjs`)
- [x] Game views: Lobby, Mission + report sheet, Incoming report, Eliminated, Debrief (played end to end on the simulator 2026-10-08)
