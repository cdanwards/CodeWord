# Spec 31: Release Operations and Dependency Stewardship

**Phase:** 10.3 (Automation and Operations)
**Priority:** High
**Effort:** 3-4 hours
**Dependencies:** Specs 29 and 30
**Blocked by:** Env validation and CI guardrails

---

## Objective

Turn "we can build" into "we can release". This spec adds a documented release process, rollback guidance, release preflight automation, dependency stewardship, and a minimal changelog discipline.

---

## Required Changes

### 1. Write the release runbook

**File:** `docs/operations/release-runbook.md`

Document:
- pre-release checklist
- version bump expectations
- internal preview build path
- production build path
- submit path
- release note expectations
- owner handoff points

### 2. Write rollback and recovery guidance

**File:** `docs/operations/rollback-and-recovery.md`

Cover:
- failed build recovery
- store rejection handling
- OTA / update rollback considerations
- database migration rollback limitations
- credential rotation ownership

### 3. Add release preflight automation

**Files:**
- `scripts/release-preflight.js`
- `package.json`

The preflight should run:
- env validation
- typecheck
- lint
- tests
- docs verification
- any lightweight EAS config sanity checks

### 4. Add automation for release-adjacent hygiene

**Files:**
- `.github/workflows/maestro-smoke.yml`
- `.github/dependabot.yml`
- `CHANGELOG.md`
- `eas.json`

Requirements:
- Maestro smoke workflow exists for mobile-flow regressions
- Dependabot is configured conservatively for npm and GitHub Actions
- `CHANGELOG.md` exists with a simple maintainable format
- `eas.json` is aligned with the documented release process

---

## Files Changed

| File | Change |
|------|--------|
| `docs/operations/release-runbook.md` | New release runbook |
| `docs/operations/rollback-and-recovery.md` | New rollback and recovery guide |
| `scripts/release-preflight.js` | New release preflight script |
| `.github/workflows/maestro-smoke.yml` | New Maestro smoke workflow |
| `.github/dependabot.yml` | New dependency update policy |
| `CHANGELOG.md` | New changelog file |
| `eas.json` | Align build/submit config with the runbook |
| `package.json` | Add release preflight entrypoint |

---

## Acceptance Criteria

- [ ] Release runbook exists and is executable by a human without tribal knowledge
- [ ] Rollback and recovery guidance exists for failed releases
- [ ] `release-preflight` script runs the documented gate checks
- [ ] Maestro smoke workflow exists for release-sensitive paths
- [ ] Dependabot is configured for npm and GitHub Actions
- [ ] `CHANGELOG.md` exists and matches the chosen release note discipline
- [ ] `eas.json` and the runbook do not contradict each other

---

## Risks

- **Runbook without ownership:** A release guide that omits who does what remains ambiguous.
- **Preflight that is too heavy:** Keep the script fast enough to run before every release candidate.

