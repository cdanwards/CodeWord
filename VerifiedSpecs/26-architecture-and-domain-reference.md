# Spec 26: Architecture and Domain Reference Docs

**Phase:** 9.2 (Post-Unified Documentation Canon)
**Priority:** High
**Effort:** 2-3 hours
**Dependencies:** Spec 25
**Blocked by:** Canonical docs structure established

---

## Objective

Document how the app actually works after the unified plan lands: routing, auth/session ownership, client data flow, and domain terms. This spec is documentation-only, but it must be derived from code and schema, not from stale planning notes.

---

## Required Changes

### 1. Write the architecture overview

**File:** `docs/architecture/overview.md`

Cover:
- Expo Router route groups and screen composition
- app startup lifecycle
- where session state lives
- where DB access lives
- expected layering after the unified refactors

### 2. Write the client data flow document

**File:** `docs/architecture/client-data-flow.md`

Document:
- sign in / sign up flow
- session restore flow
- create game flow
- join game flow
- game list refresh flow
- expected error propagation path

Use sequence-style prose or Mermaid if helpful, but keep the file readable without diagrams.

### 3. Write the auth/session lifecycle document

**File:** `docs/architecture/auth-and-session-lifecycle.md`

Cover:
- Supabase session restore
- auth state subscriptions
- profile bootstrap behavior
- sign-out path
- where tokens are stored and why

### 4. Expand the domain glossary

**File:** `specs/glossary.md`

Ensure it defines:
- host
- member
- player status
- game code
- assignment
- elimination
- game status
- round
- session restore

Make status definitions match actual schema and app behavior.

---

## Files Changed

| File | Change |
|------|--------|
| `docs/architecture/overview.md` | New architecture overview |
| `docs/architecture/client-data-flow.md` | New data-flow reference |
| `docs/architecture/auth-and-session-lifecycle.md` | New auth/session reference |
| `specs/glossary.md` | Expand and normalize domain vocabulary |

---

## Acceptance Criteria

- [ ] Architecture docs describe the actual repo structure and runtime behavior
- [ ] Data-flow doc covers auth, create game, join game, and list refresh paths
- [ ] Auth/session doc explains restore, subscription, bootstrap, and sign-out
- [ ] `specs/glossary.md` defines all core domain terms used in the app and schema
- [ ] Status names in the glossary match the implemented code/schema
- [ ] No references depend on `llm-helpers/project.md` being current

---

## Verification Strategy

1. Compare each architecture statement against code in `src/app/`, `src/components/AuthProvider.tsx`, `src/stores/`, and `src/lib/`.
2. Verify glossary terms align with `supabase/schema.ts` and game UI wording.

---

## Risks

- **Docs written from memory:** If this is not grounded in code, the repo will get a polished but wrong architecture narrative.
- **Over-documentation:** Avoid line-by-line restatements of code. Explain boundaries and flows instead.

