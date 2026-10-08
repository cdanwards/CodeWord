# Design system

The "spy dossier" look: paper screens, manila folders, ink type and one stamp-red accent. The visual source of truth is the Claude Design project **Codeword — Spy Dossier** (`f8441953-4536-4df2-a45b-9369b8ad4c3e`): `dossier.css` holds the tokens, and three boards hold the 13 screens (01 Access, 02 Assemble, 03 Mission). The full design-class to component map is in [`ClaudePlans/dossier-redesign.md`](../../ClaudePlans/dossier-redesign.md). Why it looks like this: [ADR 0003](../adr/0003-spy-dossier-design-system.md).

## Tokens

`src/theme/colors.ts` (hex conversions of the design's OKLCH tokens). Prefer these names in new code:

| Token | Use |
|---|---|
| `paper`, `paper2` | Screen and card backgrounds; subtle fills |
| `manila`, `manila2` | Case folders, the debrief screen |
| `ink`, `ink2`, `ink3` | Text: primary, secondary, faint |
| `red`, `redWash` | The only accent: stamps, primary buttons, links, the caret |
| `night`, `night2`, `onNight`, `onNight2`, `nightRule` | Dark screens (sign-in cover, active mission) |
| `rule`, `ruleStrong`, `folderBorder`, `scrim` | Lines, dashed tear lines, folder edges, sheet backdrops |

The older Ignite keys (`palette.neutral100`…, `text`, `background`, `tint`) are remapped onto these so legacy components match.

## Type

`src/theme/typography.ts` loads Barlow Condensed (display), Archivo (body) and IBM Plex Mono (labels, codes). Use `Text` presets, not raw font families:

| Preset | Looks like | For |
|---|---|---|
| `display` / `heading` / `title` / `subheading` | Condensed uppercase, 58 / 46 / 30 / 23 | Screen titles, names, words |
| `default`, `bold` | Archivo 15 | Body text |
| `copy` | Archivo 15, ink2 | Supporting sentences |
| `label` (= `formLabel`) | Mono 11, uppercase, tracked | File labels, section headers |
| `meta` | Mono 13, ink2 | Metadata lines |
| `mono` | Mono 15 | Codes |

## Components

| Component | File | Notes |
|---|---|---|
| `Button` presets | `components/Button.tsx` | `filled` (ink), `primary` (red), `default` (outline), `danger` (red outline), `paper`, `ghostNight` |
| `TextField` | `components/TextField.tsx` | Underlined form line; boxed when `multiline`; `tone="night"`; `InputComponent` |
| `TopBar` | `ui/TopBar.tsx` | `left="back" \| "close"`, mono `label`, `right` slot, `night` |
| `Stamp`, `StatusPill` | `ui/Stamp.tsx`, `ui/StatusPill.tsx` | Rubber stamps; `StatusPill` maps game status to a stamp |
| `Folder` | `ui/Folder.tsx` | Manila folder with a labeled tab; reserves `FOLDER_TAB_HEIGHT` above itself |
| `Sheet` | `ui/Sheet.tsx` | Paper card |
| `Rule` | `ui/Rule.tsx` | Solid, `strong`, `dashed`, `night` |
| `Redaction` | `ui/Redaction.tsx` | Black bar hiding a secret |
| `AgentPhoto` | `ui/AgentPhoto.tsx` | Striped placeholder with initials or a caption |
| `Chip` | `ui/Chip.tsx` | Mono tag; `selected`, `dashed`, `small`, `onPress` |
| `Segmented` | `ui/Segmented.tsx` | Joined single-choice row |
| `CodeBoxes` | `ui/CodeBoxes.tsx` | Six-box join code input (filters to the code alphabet) |
| `SheetTextInput` | `ui/SheetTextInput.ts` | Pass as `InputComponent` inside gorhom bottom sheets |

## Rules

- Use theme tokens; don't add hex values in components. If you need a new color, add it to the design file and `colors.ts` together.
- No icons or emoji. Arrows are text (`←`, `→`, `×`).
- Style with `ThemedStyle` + `themed()`; keep style objects in named constants (lint forbids inline styles).
- Copy never assumes a player's pronouns ("reports getting you to say", not "she got you to say").
- Show only real data; hide a block rather than fake it.
- Secrets stay secret: codewords are redacted until you hold to reveal, except in the report sheet where you choose one.
