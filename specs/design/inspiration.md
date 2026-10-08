## Design Inspiration References

This document captures the visual and interaction patterns from the provided mockups to guide implementation. Images were shared via chat; store exported assets in `specs/design/images/` when available and update links below.

### 1) Games List + Target module

Key elements to implement:

- Card list with clear hierarchy: title, subtitle, meta rows
- Status pill at top-right: `Waiting`, `Active`, `Ended`
- Secondary meta row: `Code: #XXXXXX` with Copy and Share icons
- Role + player count meta: `Role: Assassin • 4/8 players`
- "Your Target" module: bordered, subtle background, avatar + name + codeword subline

Component mapping:

- `Card` for game item container
- `ListItem` for target row and eliminations
- `Icon` for copy/share actions
- `Text` variants for title/subtitle/meta

Behavior notes:

- Copy/share code actions trigger global Copy/Share utility
- Status pill color map: Waiting (neutral), Active (primary), Ended (muted)

### 2) Recent Eliminations + Active Codewords

Key elements:

- Vertical activity list with avatar illustrations
- Text pattern: "Agent X eliminated Agent Y" + subline `Codeword: "Midnight" • 2 hours ago`
- "Active Codewords" grid of pills/cards

Component mapping:

- `ListView`/`ListItem` for eliminations
- `Card` or `Button` variant for codeword chips

Behavior notes:

- Time-ago formatting via utility
- Empty state when no eliminations/codewords

### 3) Home / Resume Game

Key elements:

- Welcome header: `Welcome, Agent {name}` + subtitle
- Featured game card with status pill and code + copy/share
- Primary CTA: `Resume Game`
- Secondary actions: `Enter Code`, `Create Game`

Component mapping:

- `Header` + `Card` + `Button` components

Behavior notes:

- Resume navigates to last active game detail
- Enter Code opens Join modal, Create opens Create Game modal

### Visual tokens

- Spacing: comfortable card padding, generous line-height
- Typography: strong title; subdued subtitle; muted meta
- Borders: 8–12px radius; subtle 1px border with soft shadow
- Icons: 16–20px, medium contrast

### Acceptance alignment

- Matches `requirements.md` MVP items for Games List, Game Detail components (members/roles), Home empty/resume, Copy/Share helpers, and toast/empty states.

_Last updated: 2025-08-31_
