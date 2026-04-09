# Spec 27: Database and Supabase Operations Docs

**Phase:** 9.3 (Post-Unified Documentation Canon)
**Priority:** High
**Effort:** 2-3 hours
**Dependencies:** Spec 25
**Blocked by:** Canonical docs structure established

---

## Objective

Create a durable reference for schema intent, RLS behavior, migrations, and seeding. Then fold any still-useful content from older migration/network notes into that canonical location so operational knowledge is not scattered across the repo.

---

## Required Changes

### 1. Write the schema and RLS reference

**File:** `docs/database/schema-and-rls.md`

Document:
- each public table and its purpose
- key relationships
- ownership and membership columns
- join code constraints
- policy intent for each table
- security assumptions and known limitations

### 2. Write the migrations and seeding guide

**File:** `docs/database/migrations-and-seeding.md`

Cover:
- local Supabase startup
- reset flow
- migration apply flow
- remote push cautions
- seed scripts and required env vars
- how to verify schema state after changes

### 3. Consolidate legacy notes

**Files:**
- `SUPABASE_AUTH_MIGRATION.md`
- `NOTES_NETWORK_ISSUES.md`

Move any valid information into the new docs. Then either:
- delete the legacy file, or
- replace its contents with a short archival banner and a pointer to the canonical doc

Do not leave duplicate long-form operational guidance in place.

---

## Files Changed

| File | Change |
|------|--------|
| `docs/database/schema-and-rls.md` | New schema and RLS reference |
| `docs/database/migrations-and-seeding.md` | New migrations and seeding guide |
| `SUPABASE_AUTH_MIGRATION.md` | Archive or reduce to pointer |
| `NOTES_NETWORK_ISSUES.md` | Archive or reduce to pointer |

---

## Acceptance Criteria

- [ ] Canonical database docs exist under `docs/database/`
- [ ] Table purposes and policy intent are described clearly
- [ ] Local and remote migration workflows are documented
- [ ] Seed scripts and their env requirements are documented
- [ ] Legacy docs are either removed or clearly marked non-canonical
- [ ] No operational knowledge exists only in an old ad hoc note

---

## Verification Strategy

1. Compare the docs against `supabase/schema.ts` and `supabase/migrations/*.sql`.
2. Verify the seeding instructions match actual scripts in `scripts/`.

---

## Risks

- **Security oversimplification:** Do not describe RLS in vague terms. State what each policy is protecting.
- **Partial migration of notes:** If old docs keep substantive guidance, contributors will still split across sources.

