# Spec 28: Developer Onboarding and Contributor Contract

**Phase:** 9.4 (Post-Unified Documentation Canon)
**Priority:** Medium
**Effort:** 2-3 hours
**Dependencies:** Specs 25 and 26
**Blocked by:** Canonical docs and architecture reference

---

## Objective

Make it possible for a new engineer to set up the project, understand the required quality gates, and contribute without reverse-engineering tribal process. This spec adds developer onboarding docs, a testing matrix, and a contributor contract tied to actual package scripts.

---

## Required Changes

### 1. Write local setup documentation

**File:** `docs/development/local-setup.md`

Cover:
- prerequisites
- install steps
- environment setup
- local Supabase workflow
- Expo dev-client workflow
- iOS/Android/web run paths
- common setup failures

### 2. Write the testing matrix

**File:** `docs/development/testing-matrix.md`

Document:
- typecheck
- lint
- unit tests
- coverage
- Maestro smoke tests
- manual regression expectations
- which checks are required for PRs vs releases

### 3. Add a contributor contract

**File:** `CONTRIBUTING.md`

Include:
- branch and PR expectations
- required local checks
- doc update expectations when behavior changes
- migration review expectations
- release-sensitive path review expectations

### 4. Align scripts with docs

**File:** `package.json`

Ensure scripts referenced by the docs actually exist, such as:
- `typecheck`
- `test:ci`
- `docs:verify`
- `release:preflight`

If some scripts depend on later specs, stub them only if they fail loudly and clearly.

---

## Files Changed

| File | Change |
|------|--------|
| `docs/development/local-setup.md` | New developer setup guide |
| `docs/development/testing-matrix.md` | New testing matrix |
| `CONTRIBUTING.md` | New contributor contract |
| `package.json` | Add or normalize scripts referenced in docs |

---

## Acceptance Criteria

- [ ] A new engineer can follow `docs/development/local-setup.md` to run the project
- [ ] The testing matrix distinguishes PR checks from release checks
- [ ] `CONTRIBUTING.md` defines minimum quality expectations
- [ ] `package.json` includes the scripts referenced by the new docs
- [ ] There is no mismatch between documentation commands and repo scripts

---

## Risks

- **Fictional scripts:** Do not document commands that do not exist.
- **Contributor doc drift:** Keep the contract procedural and durable, not overly detailed to current branch habits.

