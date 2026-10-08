# ADR 0003: Spy-dossier design system

- Status: accepted
- Date: 2026-10-08

## Context

The app still looked like the Ignite boilerplate, with leftover debug colors and emoji that rendered as boxes. The game has a strong theme (agents, targets, codewords) that the UI did not use.

## Decision

A "spy dossier" visual language, designed in Claude Design (project "Codeword — Spy Dossier", `f8441953-4536-4df2-a45b-9369b8ad4c3e`) and ported to the app:

- Paper and manila surfaces, ink text, one accent: stamp red. Game status is a rubber stamp.
- Condensed uppercase display type (Barlow Condensed), Archivo body copy, IBM Plex Mono for labels and codes.
- Light-only. Only the sign-in cover and the active mission screen are dark, and they opt in explicitly (`app.json` sets `userInterfaceStyle: "light"`).
- No icons or emoji: arrows are text, tab marks are squares, photos are striped placeholders.

The design file is the visual source of truth. `docs/development/design-system.md` maps it to components.

## Consequences

- The design used condensed Archivo, which Expo can't load (its width axis is variable-only), so both the app and the design file use Barlow Condensed.
- React Native has no OKLCH, so `src/theme/colors.ts` holds hex conversions of the design's tokens. Change both together.
- The dark theme reuses the light palette (`colorsDark.ts` re-exports `colors`).
