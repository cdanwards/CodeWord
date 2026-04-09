# Spec 30: CI, Docs Verification, and PR Guardrails

**Phase:** 10.2 (Automation and Operations)
**Priority:** High
**Effort:** 3-4 hours
**Dependencies:** Specs 28 and 29
**Blocked by:** Onboarding docs and env validation

---

## Objective

Add the automation and guardrails that keep the repo from drifting: main CI, docs link verification, PR expectations, ownership metadata, and realistic test/config defaults for automation.

---

## Required Changes

### 1. Add the main CI workflow

**File:** `.github/workflows/ci.yml`

Run at minimum:
- install
- `yarn typecheck`
- `yarn lint:check`
- `yarn test:ci`
- env validation as appropriate for non-secret checks

### 2. Add docs verification

**Files:**
- `scripts/verify-doc-links.js`
- `.github/workflows/docs-lint.yml`

The script should verify relative markdown links in:
- `README.md`
- `docs/`
- `specs/`
- `MainPlans/`
- `VerifiedSpecs/`

The workflow should run on markdown changes.

### 3. Add PR and ownership guardrails

**Files:**
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/CODEOWNERS`

Requirements:
- PR template includes checklist items for docs, tests, migrations, release impact, and screenshots when UI changes
- CODEOWNERS covers sensitive areas like `supabase/`, `src/lib/`, `src/stores/`, and `docs/operations/`

### 4. Tighten CI-facing config

**Files:**
- `jest.config.js`
- `tsconfig.json`
- `package.json`

Requirements:
- test config supports CI execution and realistic coverage output
- TS config does not silently exclude files that CI is expected to care about
- package scripts are consistent with workflow usage

---

## Files Changed

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | New main CI workflow |
| `.github/workflows/docs-lint.yml` | New docs verification workflow |
| `scripts/verify-doc-links.js` | New docs link checker |
| `.github/PULL_REQUEST_TEMPLATE.md` | New PR checklist |
| `.github/CODEOWNERS` | New path ownership metadata |
| `jest.config.js` | CI-friendly test config |
| `tsconfig.json` | Align TS checking with repo expectations |
| `package.json` | Script normalization for CI |

---

## Acceptance Criteria

- [ ] CI workflow exists and runs typecheck, lint, and tests
- [ ] Broken relative links in docs fail the docs verification step
- [ ] PR template includes docs/tests/migration/release-impact checks
- [ ] CODEOWNERS covers high-risk paths
- [ ] Jest and TS configs match the workflow assumptions
- [ ] Local commands used by CI are runnable from `package.json`

---

## Risks

- **False-positive docs linting:** Keep the link checker simple and repo-relative.
- **CI that cannot pass locally:** Every workflow command must be reproducible via documented local scripts.

