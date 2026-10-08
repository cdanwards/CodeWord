# Spec 33: Supabase Verification and Script Hardening

**Phase:** 11.2 (Operational Maturity)
**Priority:** Medium
**Effort:** 2-3 hours
**Dependencies:** Specs 27, 29, and 31
**Blocked by:** Canonical DB docs, env validation, and release baseline

---

## Objective

Make Supabase maintenance safer by documenting what "healthy" means, adding a verification script for expected schema/policy state, and hardening existing seed/test scripts so they fail clearly instead of ambiguously.

---

## Required Changes

### 1. Extend database ops docs with verification steps

**File:** `docs/database/migrations-and-seeding.md`

Add:
- how to verify schema is current
- how to verify expected policies exist
- how to confirm seed scripts still match the schema
- how to tell local vs remote state apart

### 2. Add a Supabase verification script

**Files:**
- `scripts/verify-supabase-policies.js`
- `package.json`

The script should verify, where practical:
- required tables exist
- expected policies/functions exist
- required env vars are present before connecting

### 3. Harden existing maintenance scripts

**Files:**
- `scripts/seed-game.js`
- `scripts/test-supabase.js`

Requirements:
- validate env first
- print clear actionable failures
- avoid misleading partial success output

---

## Files Changed

| File | Change |
|------|--------|
| `docs/database/migrations-and-seeding.md` | Add explicit verification steps |
| `scripts/verify-supabase-policies.js` | New policy/schema verification script |
| `scripts/seed-game.js` | Harden failure handling and env checks |
| `scripts/test-supabase.js` | Harden failure handling and env checks |
| `package.json` | Add Supabase verification script entries |

---

## Acceptance Criteria

- [ ] Database ops docs explain how to verify schema and policy state
- [ ] `verify-supabase-policies` exists and fails clearly when required state is missing
- [ ] Existing Supabase maintenance scripts validate env before running
- [ ] Script output is actionable and not ambiguous
- [ ] `package.json` exposes script entrypoints for verification and maintenance

---

## Risks

- **Brittle metadata checks:** Keep verification focused on stable expectations, not every possible schema detail.
- **False confidence:** Script verification should supplement, not replace, documented manual checks.

