# Spec 01: Dead Code & Legacy Artifact Removal

**Phase:** 1 (Pre-Flight)
**Priority:** Critical — must complete before any other work
**Effort:** < 1 hour
**Dependencies:** None
**Blocked by:** Nothing

---

## Objective

Remove all dead code and legacy artifacts from the Better Auth migration. This reduces the surface area for future upgrades and eliminates developer confusion about which modules are active.

---

## Files to Delete

### 1. `src/lib/auth.ts` (dead auth module)

**Why:** This file is never imported anywhere in the codebase. `src/lib/auth-client.ts` is the actual auth entry point used by `authStore.ts`. Both wrap Supabase identically, but only `auth-client.ts` is wired up.

**Verification before deleting:** Run `grep -r "from.*lib/auth\"" src/` and `grep -r "from.*lib/auth'" src/` — should return zero results (only `auth-client` imports will match).

### 2. `llm-helpers/better_auth.md` (631KB stale documentation)

**Why:** Documents the Better Auth system that was fully migrated to Supabase Auth. Massive file that provides no value and confuses AI-assisted development.

### 3. Root-level test scripts (4 files)

| File | Why |
|------|-----|
| `test-auth.js` | Plain Node script that `require()`s React Native modules — will never execute outside RN runtime |
| `test-db.js` | Same — ad-hoc debug script, not a real test |
| `test-profile.js` | Same |
| `test-zustand.js` | Same |

**Verification before deleting:** Confirm these are NOT referenced in `package.json` scripts. Run `grep -r "test-auth\|test-db\|test-profile\|test-zustand" package.json` — should return zero results.

### 4. `scripts/seed-users.js` (dead seed script)

**Why:** References the old Better Auth schema (dropped tables from migration 001). The tables it tries to insert into no longer exist.

### 5. Better Auth environment variables

**File:** `.env`
**Action:** Remove these lines:
- `BETTER_AUTH_SECRET=...`
- `BETTER_AUTH_URL=...`

**Why:** Stale secrets from the previous auth system. The app uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` exclusively.

---

## Acceptance Criteria

- [ ] `src/lib/auth.ts` deleted
- [ ] `llm-helpers/better_auth.md` deleted
- [ ] `test-auth.js`, `test-db.js`, `test-profile.js`, `test-zustand.js` deleted from project root
- [ ] `scripts/seed-users.js` deleted
- [ ] `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` removed from `.env`
- [ ] `yarn compile` passes (no broken imports)
- [ ] `yarn test` passes (no test regressions)
- [ ] No remaining imports of `src/lib/auth.ts` anywhere in the codebase

---

## Risks

None. All files being deleted are confirmed unused.
