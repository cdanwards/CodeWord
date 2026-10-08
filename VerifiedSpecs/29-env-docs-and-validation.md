# Spec 29: Environment Documentation and Validation

**Phase:** 10.1 (Automation and Operations)
**Priority:** High
**Effort:** 2-3 hours
**Dependencies:** Spec 25
**Blocked by:** Canonical docs structure

---

## Objective

Stop environment setup from being implicit. This spec inventories all env usage, adds a complete `.env.example`, documents variables in one place, and adds validation so missing config fails early with clear messages.

---

## Required Changes

### 1. Inventory env usage

Review:
- `app.config.ts`
- `src/`
- `supabase/`
- `scripts/`

Capture all variables used for:
- client runtime
- local development
- local Supabase
- remote seed/test scripts
- optional feature flags

### 2. Add `.env.example`

**File:** `.env.example`

Requirements:
- list every required variable
- separate required vs optional
- comment variables used only by scripts
- never include live secrets

### 3. Add typed env access

**File:** `src/config/env.ts`

Responsibilities:
- validate client-safe env at startup
- expose a small typed interface to the app
- avoid raw `process.env` access across the codebase

### 4. Document environment variables

**File:** `docs/operations/environment-variables.md`

Document:
- each variable
- where it is consumed
- whether it is safe for client exposure
- sample local values / shape
- common mistakes

### 5. Add a validation script

**Files:**
- `scripts/validate-env.js`
- `package.json`
- `app.config.ts`

The validator should:
- read `.env` / process environment
- fail with a precise missing-variable list
- be usable in CI and release preflight

Update `app.config.ts` only as needed so env access is consistent with the validation layer.

---

## Files Changed

| File | Change |
|------|--------|
| `.env.example` | New template with comments and placeholders |
| `src/config/env.ts` | New typed env accessor |
| `docs/operations/environment-variables.md` | New env reference |
| `scripts/validate-env.js` | New env validation script |
| `app.config.ts` | Align with validated env access |
| `package.json` | Add env validation script entrypoint |

---

## Acceptance Criteria

- [ ] `.env.example` exists and covers every required variable
- [ ] Canonical env docs exist under `docs/operations/`
- [ ] App code has a typed env access layer
- [ ] `scripts/validate-env.js` exits non-zero on missing required variables
- [ ] Validation output is actionable, not generic
- [ ] No doc still says "see `.env.example`" if that file would remain missing or incomplete

---

## Verification Strategy

1. Run the validator with required variables unset and confirm it fails clearly.
2. Run it with a complete local env and confirm it passes.

---

## Risks

- **Over-validating server-only values in client contexts:** Keep client-safe and script-only variables separate.
- **Reintroducing scattered env access:** If modules keep reading raw env directly, drift will return.

