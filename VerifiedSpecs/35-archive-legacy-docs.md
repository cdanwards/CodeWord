# Spec 35: Archive and Label Legacy Documentation

**Phase:** 11.4 (Operational Maturity)
**Priority:** Medium
**Effort:** 1-2 hours
**Dependencies:** Specs 25, 26, 27, 28, 31, and 32
**Blocked by:** Canonical replacements existing

---

## Objective

Once canonical documentation exists, cleanly retire or label older planning/helper material so contributors stop mistaking historical documents for the current truth.

---

## Required Changes

### 1. Review legacy documentation folders

Primary targets:
- `llm-helpers/project.md`
- `llm-helpers/implementation-roadmap.md`
- `Evaluations/*.md`
- any remaining standalone notes superseded by docs under `docs/`

### 2. Decide archive strategy per file

For each file:
- keep and label as historical, or
- reduce to a short pointer, or
- delete if fully obsolete and low-value

Historical files that remain should begin with a banner such as:
- this file is archival
- canonical replacement lives at `docs/...`

### 3. Update docs navigation

**Files:**
- `docs/README.md`
- `README.md`

Add a short section that explains:
- which folders are canonical
- which are planning artifacts
- which are archival review material

---

## Files Changed

| File | Change |
|------|--------|
| `llm-helpers/project.md` | Archive banner, pointer, or deletion |
| `llm-helpers/implementation-roadmap.md` | Archive banner, pointer, or deletion |
| `Evaluations/*.md` | Archive banner or pointer as appropriate |
| `docs/README.md` | Clarify canonical vs archival folders |
| `README.md` | Add brief navigation note if needed |

---

## Acceptance Criteria

- [ ] No stale helper/planning doc looks authoritative by accident
- [ ] Canonical docs and archival docs are clearly distinguished
- [ ] Historical materials retained for context are labeled as such
- [ ] `docs/README.md` explains the role of `docs/`, `specs/`, `MainPlans/`, `VerifiedSpecs/`, and archival folders

---

## Risks

- **Deleting useful context:** Prefer archival banners over deletion when historical reasoning still helps future maintainers.
- **Half-archived state:** If some files are labeled and others are not, confusion remains.
