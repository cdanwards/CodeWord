# Ownership and decision records

## Who updates docs

Whoever changes the behavior updates the doc in the same change. There is no separate docs pass.

| If you change | Update |
|---|---|
| A migration, table, policy or engine function | [Schema and RLS](../database/schema-and-rls.md), [migrations and seeding](../database/migrations-and-seeding.md), `Mission` / `Board` types, and a check in `scripts/simulate-game.mjs` |
| A game rule | [ADR 0002](../adr/0002-server-side-game-engine.md) (or a new ADR), the [glossary](../../specs/glossary.md), `specs/requirements.md` |
| Data loading or a `db` helper | [Client data flow](../architecture/client-data-flow.md) |
| Auth, sessions or route guards | [Auth and session lifecycle](../architecture/auth-and-session-lifecycle.md) |
| Setup steps, tools or scripts | [Local setup](../development/local-setup.md), [testing matrix](../development/testing-matrix.md), `README.md` |
| Colors, type or a dossier component | The Claude Design file, [design system](../development/design-system.md) |
| A convention agents must follow | `CLAUDE.md` |

## When to write an ADR

Write one in `docs/adr/NNNN-title.md` when a choice is hard to reverse or would surprise someone reading the code:

- Where logic lives (client vs database), or a new external service
- A rule of the game
- A security boundary
- Replacing a library or pattern used across the app

Format: status, date, context (what forced the decision), decision, consequences. Don't rewrite accepted ADRs; supersede them with a new one and mark the old one `Status: superseded by NNNN`.

## Decisions so far

- [0001](../adr/0001-documentation-source-of-truth.md) Documentation source of truth
- [0002](../adr/0002-server-side-game-engine.md) Server-side game engine
- [0003](../adr/0003-spy-dossier-design-system.md) Spy-dossier design system
