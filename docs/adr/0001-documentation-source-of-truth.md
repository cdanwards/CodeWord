# ADR 0001: Documentation source of truth

- Status: accepted
- Date: 2026-10-08

## Context

By October 2026 the repo had overlapping, partly stale material in several places: `specs/`, `MainPlans/`, `VerifiedSpecs/`, `Evaluations/`, `ClaudePlans/`, `llm-helpers/`, and loose notes at the root. Several described a database and game loop that no longer exist. New contributors (people and agents) could not tell which to trust.

## Decision

| Location | Holds | Canonical? |
|---|---|---|
| `docs/` | How the system works and how to work on it: architecture, database, development, decisions | Yes |
| `specs/` | Product requirements and behavior (`requirements.md`, `design.md`, `glossary.md`) | Yes, for product intent |
| `README.md` | Landing page: what the app is, how to run it, where docs live | Yes, but brief |
| `CLAUDE.md` | Rules and conventions for coding agents; points into `docs/` | Yes, for agent rules |
| `MainPlans/`, `VerifiedSpecs/` | Rollout plans and scoped work specs | No: plans, may be done or superseded |
| `ClaudePlans/` | Implementation plans written while doing work | No, except where `docs/` links to one |
| `Evaluations/`, `llm-helpers/`, root notes | Reviews and old working notes | No: historical |

## Rules

- A change that alters behavior updates the doc that describes it in the same change.
- When a plan or spec is finished, mark it done at the top and link to where the result is documented; don't delete it.
- If a doc is wrong and you can't fix it now, add a `> Out of date:` note at the top saying what's wrong.
- Architectural choices get an ADR in `docs/adr/` (see [ownership and decision records](../governance/ownership-and-decision-records.md)).
