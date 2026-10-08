# Spec 25: Documentation Canon, ADR, and Root Navigation

**Phase:** 9.1 (Post-Unified Documentation Canon)
**Priority:** High
**Effort:** 1-2 hours
**Dependencies:** Spec 24
**Blocked by:** Unified initial plan completion

---

## Objective

Establish a single source of truth for project documentation so the repo stops competing with itself. This spec defines canonical doc ownership, creates a docs index, and rewrites root navigation so new contributors know where to look first.

---

## Required Changes

### 1. Create a documentation ADR

**File:** `docs/adr/0001-documentation-source-of-truth.md`

Define:
- `docs/` is the canonical home for durable project documentation
- `specs/` is for product and behavior requirements
- `MainPlans/` is for executable rollout plans
- `VerifiedSpecs/` is for scoped worker specs
- `ClaudePlans/`, `llm-helpers/`, and ad hoc notes are non-canonical unless explicitly promoted

Include:
- rationale for the split
- update rules when behavior changes
- archival rules for stale docs

### 2. Create the docs entrypoint

**File:** `docs/README.md`

Sections:
1. Start here
2. Architecture
3. Database
4. Development
5. Operations
6. Security
7. Governance
8. Historical / non-canonical material

### 3. Rewrite root navigation

**Files:**
- `README.md`
- `CLAUDE.md`

`README.md` should become a concise landing page:
- what CodewordApp is
- how to run it
- where canonical docs live
- where plans/specs live

`CLAUDE.md` should:
- point agents to `docs/README.md`
- explicitly warn against treating `llm-helpers/` as authoritative
- link to `MainPlans/` and `VerifiedSpecs/`

### 4. Add ownership guidance

**File:** `docs/governance/ownership-and-decision-records.md`

Capture:
- who owns docs changes when code changes
- when an ADR is required
- where architectural decisions are recorded

---

## Files Changed

| File | Change |
|------|--------|
| `docs/adr/0001-documentation-source-of-truth.md` | New ADR defining canonical documentation ownership |
| `docs/README.md` | New documentation index |
| `docs/governance/ownership-and-decision-records.md` | New governance guide |
| `README.md` | Rewrite top-level navigation around canonical docs |
| `CLAUDE.md` | Point agents/operators to canonical docs and plans |

---

## Acceptance Criteria

- [ ] `docs/` is explicitly defined as canonical for durable documentation
- [ ] `docs/README.md` exists and links to all major documentation areas
- [ ] `README.md` no longer reads like Ignite boilerplate
- [ ] `README.md` links to `docs/README.md`, `MainPlans/`, and `VerifiedSpecs/`
- [ ] `CLAUDE.md` references canonical docs and warns about stale helper material
- [ ] Governance doc explains how doc ownership and ADR creation work

---

## Risks

- **Two competing entrypoints:** If `README.md` and `docs/README.md` both become long-form docs, drift will return. Keep `README.md` thin and navigational.
- **Incomplete canon declaration:** If archival folders are not explicitly labeled non-canonical, contributors will keep guessing.

