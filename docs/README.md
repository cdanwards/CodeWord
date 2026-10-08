# Codeword documentation

`docs/` is the canonical home for how Codeword works and how to work on it. If something here disagrees with the code, the code wins and this doc is a bug: fix it in the same change. See [ADR 0001](adr/0001-documentation-source-of-truth.md) for what lives where.

## Start here

1. [Local setup](development/local-setup.md): run the app against a local Supabase stack.
2. [Architecture overview](architecture/overview.md): the moving parts and how they fit.
3. [Glossary](../specs/glossary.md): operation, agent, codeword, kill report and the status values.

## Architecture

- [Overview](architecture/overview.md): stack, layers, folders, routes
- [Client data flow](architecture/client-data-flow.md): how screens load data and call the game engine
- [Auth and session lifecycle](architecture/auth-and-session-lifecycle.md): sign-up, sign-in, route guards, persistence

## Database

- [Schema and RLS](database/schema-and-rls.md): tables, the engine functions, and who can read or write what
- [Migrations and seeding](database/migrations-and-seeding.md): applying, writing and testing migrations; test data

## Development

- [Local setup](development/local-setup.md)
- [Testing matrix](development/testing-matrix.md): what each check covers and when to run it
- [Design system](development/design-system.md): the spy-dossier look and its components

## Decisions

- [ADR 0001: Documentation source of truth](adr/0001-documentation-source-of-truth.md)
- [ADR 0002: Server-side game engine](adr/0002-server-side-game-engine.md)
- [ADR 0003: Spy-dossier design system](adr/0003-spy-dossier-design-system.md)
- [Ownership and decision records](governance/ownership-and-decision-records.md)

## Product

- [`specs/requirements.md`](../specs/requirements.md), [`specs/design.md`](../specs/design.md): product requirements and behavior
- [`specs/glossary.md`](../specs/glossary.md): domain vocabulary

## Historical and non-canonical material

These record how the project got here. They are not instructions; prefer the docs above.

- `MainPlans/`: rollout plans from April 2026
- `VerifiedSpecs/`: scoped work specs (index in `VerifiedSpecs/00-INDEX.md`). Several are now done or superseded; check the code first.
- `Evaluations/`: April 2026 codebase reviews
- `ClaudePlans/`: implementation plans (the redesign plan doubles as the design-to-code map)
- `llm-helpers/`, `specs/tasks.md`, `specs/tickets.*`, `NOTES_NETWORK_ISSUES.md`, `SUPABASE_AUTH_MIGRATION.md`: older working notes, partly out of date
