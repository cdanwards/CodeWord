# Post-Unified Documentation And Repo Advancement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the repo into an authoritative, operable, and releaseable project after `MainPlans/unified-initial-plan.md` completes by adding durable documentation, operational automation, release discipline, and long-term repo maintenance improvements.

**Architecture:** This plan assumes the hardening, upgrade, refactor, and baseline documentation work in `MainPlans/unified-initial-plan.md` is complete first. It then adds a source-of-truth documentation system, environment and release runbooks, repo automation, observability and security hygiene, and governance artifacts so contributors can understand, validate, operate, and ship the app without relying on tribal knowledge.

**Tech Stack:** Expo Router, React Native, TypeScript, Supabase, Jest, Maestro, EAS Build/Submit, GitHub Actions, Markdown docs

---

## Prerequisites

- `MainPlans/unified-initial-plan.md` is complete or deliberately superseded.
- `yarn compile && yarn lint:check && yarn test` passes on the default branch.
- The repo has the post-unified baseline docs in place: `README.md`, `CLAUDE.md`, and `specs/glossary.md`.
- The implementation owner agrees that `docs/` becomes the canonical location for durable project documentation; `llm-helpers/` and ad hoc notes become archival or working materials, not source of truth.

## File Structure

### Documentation system

- Create: `docs/README.md`
- Create: `docs/architecture/overview.md`
- Create: `docs/architecture/client-data-flow.md`
- Create: `docs/architecture/auth-and-session-lifecycle.md`
- Create: `docs/database/schema-and-rls.md`
- Create: `docs/database/migrations-and-seeding.md`
- Create: `docs/development/local-setup.md`
- Create: `docs/development/testing-matrix.md`
- Create: `docs/operations/environment-variables.md`
- Create: `docs/operations/release-runbook.md`
- Create: `docs/operations/rollback-and-recovery.md`
- Create: `docs/operations/incident-triage.md`
- Create: `docs/security/security-model.md`
- Create: `docs/quality/accessibility-and-performance.md`
- Create: `docs/governance/ownership-and-decision-records.md`
- Create: `docs/adr/0001-documentation-source-of-truth.md`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `specs/glossary.md`
- Modify or delete after migration: `llm-helpers/project.md`
- Modify or delete after migration: `SUPABASE_AUTH_MIGRATION.md`
- Modify or delete after migration: `NOTES_NETWORK_ISSUES.md`

### Repo automation and governance

- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/maestro-smoke.yml`
- Create: `.github/workflows/docs-lint.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/CODEOWNERS`
- Create: `.github/dependabot.yml`
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`

### Environment, scripts, and quality gates

- Create: `.env.example`
- Create: `src/config/env.ts`
- Create: `scripts/validate-env.js`
- Create: `scripts/verify-doc-links.js`
- Create: `scripts/release-preflight.js`
- Create: `scripts/verify-supabase-policies.js`
- Modify: `package.json`
- Modify: `jest.config.js`
- Modify: `tsconfig.json`
- Modify: `.eslintrc.js` or `eslint.config.mjs` depending on post-unified state

### Observability and runtime operations

- Modify: `src/utils/crashReporting.ts`
- Create: `src/lib/telemetry/events.ts`
- Create: `src/lib/telemetry/logger.ts`
- Modify: `src/components/ErrorBoundary/ErrorBoundary.tsx`
- Modify: `src/components/AuthProvider.tsx`
- Modify: `src/screens/GamesScreen.tsx`
- Modify: `src/screens/LoginScreen.tsx`
- Modify: `src/screens/SignupScreen.tsx`
- Modify: `src/app/_layout.tsx`

---

## Chunk 1: Documentation Source Of Truth

### Task 1: Freeze the post-unified baseline and define canon

**Files:**
- Modify: `MainPlans/unified-initial-plan.md`
- Create: `docs/adr/0001-documentation-source-of-truth.md`
- Create: `docs/README.md`
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Record the implementation baseline**

Run:

```bash
yarn compile && yarn lint:check && yarn test
```

Expected: all three commands pass so the docs describe a known-good state, not a broken one.

- [ ] **Step 2: Write the source-of-truth ADR**

Document in `docs/adr/0001-documentation-source-of-truth.md`:
- `docs/` is canonical for durable project documentation.
- `specs/` is for requirements and product scope.
- `MainPlans/` is for execution plans.
- `ClaudePlans/` is historical planning input unless promoted.
- `llm-helpers/` is archival or working scratch space.

- [ ] **Step 3: Create the docs index**

Add `docs/README.md` with sections:
- What this repo is
- Where to start
- Architecture docs
- Database docs
- Development docs
- Operations docs
- Security docs
- Governance docs

- [ ] **Step 4: Rewrite root navigation**

Update `README.md` so it becomes a concise landing page that links to `docs/README.md`, key run commands, setup instructions, and release docs rather than trying to duplicate all detail.

- [ ] **Step 5: Update the agent/operator brief**

Update `CLAUDE.md` to reference the canonical docs paths and explicitly warn against relying on stale `llm-helpers/` files.

- [ ] **Step 6: Commit**

```bash
git add MainPlans/unified-initial-plan.md docs/adr/0001-documentation-source-of-truth.md docs/README.md README.md CLAUDE.md
git commit -m "docs: establish canonical documentation structure"
```

### Task 2: Write the architecture and domain set

**Files:**
- Create: `docs/architecture/overview.md`
- Create: `docs/architecture/client-data-flow.md`
- Create: `docs/architecture/auth-and-session-lifecycle.md`
- Modify: `specs/glossary.md`
- Modify: `README.md`

- [ ] **Step 1: Map the architecture from code, not memory**

Inspect:

```bash
sed -n '1,220p' src/app/_layout.tsx
sed -n '1,220p' src/components/AuthProvider.tsx
sed -n '1,260p' src/stores/authStore.ts
sed -n '1,320p' src/lib/database.ts
```

Expected: enough context to describe routing, auth/session ownership, and DB access boundaries accurately.

- [ ] **Step 2: Write the system overview**

In `docs/architecture/overview.md`, cover:
- Route groups and screen composition
- Where session state lives
- How the app talks to Supabase
- Where domain logic should live after refactors
- What remains intentionally client-side vs. database-enforced

- [ ] **Step 3: Write the client data-flow doc**

In `docs/architecture/client-data-flow.md`, document:
- UI event -> screen -> store/helper -> Supabase -> UI refresh
- create game flow
- join game flow
- profile bootstrap flow
- expected error propagation path

- [ ] **Step 4: Write the auth/session lifecycle doc**

In `docs/architecture/auth-and-session-lifecycle.md`, document:
- app startup session restore
- auth state change subscription
- profile provisioning
- sign-out behavior
- token storage ownership and security boundaries

- [ ] **Step 5: Expand the glossary**

Ensure `specs/glossary.md` defines:
- host
- member
- profile
- game code
- assignment
- elimination
- status
- session restore

- [ ] **Step 6: Commit**

```bash
git add docs/architecture/overview.md docs/architecture/client-data-flow.md docs/architecture/auth-and-session-lifecycle.md specs/glossary.md README.md
git commit -m "docs: add architecture and domain reference"
```

### Task 3: Write the database and operational data docs

**Files:**
- Create: `docs/database/schema-and-rls.md`
- Create: `docs/database/migrations-and-seeding.md`
- Modify: `README.md`
- Modify or delete after migration: `SUPABASE_AUTH_MIGRATION.md`
- Modify or delete after migration: `NOTES_NETWORK_ISSUES.md`

- [ ] **Step 1: Read the actual schema artifacts**

Run:

```bash
sed -n '1,260p' supabase/schema.ts
sed -n '1,260p' supabase/migrations/001_update_for_supabase_auth.sql
sed -n '1,260p' supabase/migrations/002_gameplay_extensions.sql
sed -n '1,260p' supabase/migrations/003_games_policies.sql
```

Expected: enough detail to document tables, relationships, invariants, and RLS behavior.

- [ ] **Step 2: Write the schema/RLS document**

In `docs/database/schema-and-rls.md`, include:
- table-by-table purpose
- ownership columns
- unique constraints and join-code behavior
- RLS policy intent
- open security assumptions

- [ ] **Step 3: Write the migration/seeding guide**

In `docs/database/migrations-and-seeding.md`, include:
- local Supabase startup
- reset flow
- local vs remote migration application
- seed scripts and required env vars
- rollback expectations for bad migrations

- [ ] **Step 4: Consolidate legacy notes**

Move still-valid content from `SUPABASE_AUTH_MIGRATION.md` and `NOTES_NETWORK_ISSUES.md` into the canonical docs, then either delete those files or replace them with one-line pointers to the new docs.

- [ ] **Step 5: Commit**

```bash
git add docs/database/schema-and-rls.md docs/database/migrations-and-seeding.md README.md SUPABASE_AUTH_MIGRATION.md NOTES_NETWORK_ISSUES.md
git commit -m "docs: add database and Supabase operations reference"
```

### Task 4: Write the developer and contributor onboarding set

**Files:**
- Create: `docs/development/local-setup.md`
- Create: `docs/development/testing-matrix.md`
- Create: `CONTRIBUTING.md`
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Define the local setup path**

Document in `docs/development/local-setup.md`:
- prerequisites
- env setup
- Supabase local startup
- Expo dev-client workflow
- local build shortcuts
- common failure modes

- [ ] **Step 2: Define the testing matrix**

Document in `docs/development/testing-matrix.md`:
- typecheck
- lint
- unit tests
- Maestro smoke tests
- manual iOS/Android regression expectations
- when each layer is required before merge vs before release

- [ ] **Step 3: Add the contributor contract**

Create `CONTRIBUTING.md` with:
- branch and PR expectations
- required local checks
- doc update expectations when behavior changes
- migration/change-management rules for Supabase
- release-sensitive areas requiring extra review

- [ ] **Step 4: Add missing package scripts**

Update `package.json` with scripts that match the docs, for example:
- `typecheck`
- `lint`
- `lint:check`
- `test:ci`
- `docs:verify`
- `release:preflight`

- [ ] **Step 5: Commit**

```bash
git add docs/development/local-setup.md docs/development/testing-matrix.md CONTRIBUTING.md README.md package.json
git commit -m "docs: add contributor onboarding and testing matrix"
```

---

## Chunk 2: Repo Automation And Release Discipline

### Task 5: Add environment templates and validation

**Files:**
- Create: `.env.example`
- Create: `src/config/env.ts`
- Create: `scripts/validate-env.js`
- Modify: `app.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Inventory env usage from code**

Run:

```bash
rg -n "process\\.env|extra\\.|SUPABASE_|EAS_|EXPO_PUBLIC_" app.config.ts src supabase scripts
```

Expected: a definitive list of runtime and script env variables.

- [ ] **Step 2: Create `.env.example`**

List every required variable with comments for:
- local development
- local Supabase
- remote Supabase scripts
- optional feature flags

- [ ] **Step 3: Add typed env access**

Create `src/config/env.ts` to validate required client-safe env values at startup and expose a small typed surface to the app instead of reading raw `process.env` in multiple places.

- [ ] **Step 4: Add a preflight validator**

Create `scripts/validate-env.js` and add `package.json` scripts:

```bash
node scripts/validate-env.js
```

Expected: exits non-zero with a clear missing-variable list when setup is incomplete.

- [ ] **Step 5: Commit**

```bash
git add .env.example src/config/env.ts scripts/validate-env.js app.config.ts package.json
git commit -m "ops: add environment templates and validation"
```

### Task 6: Add CI, docs verification, and repo guardrails

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/docs-lint.yml`
- Create: `scripts/verify-doc-links.js`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/CODEOWNERS`
- Modify: `package.json`
- Modify: `jest.config.js`
- Modify: `tsconfig.json`

- [ ] **Step 1: Add the main CI workflow**

Create `.github/workflows/ci.yml` with jobs for:
- install
- `yarn typecheck`
- `yarn lint:check`
- `yarn test:ci`
- optional docs verification

- [ ] **Step 2: Add docs verification**

Create `scripts/verify-doc-links.js` to fail on broken relative markdown links inside `README.md`, `docs/`, `specs/`, and `MainPlans/`.

- [ ] **Step 3: Add the docs workflow**

Create `.github/workflows/docs-lint.yml` to run the docs verification script on markdown changes.

- [ ] **Step 4: Add contribution guardrails**

Create:
- `.github/PULL_REQUEST_TEMPLATE.md` with checklist items for docs, tests, migrations, and release impact
- `.github/CODEOWNERS` for sensitive paths such as `supabase/`, `src/stores/`, `src/lib/`, and `docs/operations/`

- [ ] **Step 5: Tighten test and TS defaults**

Modify:
- `jest.config.js` to support CI-friendly output and realistic coverage reporting
- `tsconfig.json` so test-related docs and scripts do not silently drift from the checked configuration

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/docs-lint.yml .github/PULL_REQUEST_TEMPLATE.md .github/CODEOWNERS scripts/verify-doc-links.js package.json jest.config.js tsconfig.json
git commit -m "ci: add repo guardrails and docs verification"
```

### Task 7: Add release management and dependency stewardship

**Files:**
- Create: `docs/operations/release-runbook.md`
- Create: `docs/operations/rollback-and-recovery.md`
- Create: `scripts/release-preflight.js`
- Create: `.github/workflows/maestro-smoke.yml`
- Create: `.github/dependabot.yml`
- Create: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `eas.json`

- [ ] **Step 1: Write the release runbook**

In `docs/operations/release-runbook.md`, cover:
- required pre-release checks
- version bump process
- EAS build profiles
- internal preview build path
- production build path
- submit path
- release note expectations

- [ ] **Step 2: Write the rollback/recovery doc**

In `docs/operations/rollback-and-recovery.md`, cover:
- failed build recovery
- rejected store submission handling
- bad OTA/update response
- migration rollback limitations
- credential rotation ownership

- [ ] **Step 3: Add release preflight automation**

Create `scripts/release-preflight.js` to run:
- env validation
- typecheck
- lint
- tests
- docs verification
- optional EAS config presence checks

- [ ] **Step 4: Add Maestro smoke automation**

Create `.github/workflows/maestro-smoke.yml` that runs when mobile flow files change or before release branches are merged. Keep the first version small and stable.

- [ ] **Step 5: Add dependency automation**

Create `.github/dependabot.yml` with conservative update cadence for:
- npm dependencies
- GitHub Actions

- [ ] **Step 6: Commit**

```bash
git add docs/operations/release-runbook.md docs/operations/rollback-and-recovery.md scripts/release-preflight.js .github/workflows/maestro-smoke.yml .github/dependabot.yml CHANGELOG.md package.json eas.json
git commit -m "release: add runbooks and dependency automation"
```

---

## Chunk 3: Operational Maturity Beyond The Current Plan

### Task 8: Add observability, logging policy, and incident docs

**Files:**
- Modify: `src/utils/crashReporting.ts`
- Create: `src/lib/telemetry/events.ts`
- Create: `src/lib/telemetry/logger.ts`
- Create: `docs/operations/incident-triage.md`
- Create: `docs/security/security-model.md`
- Modify: `src/components/ErrorBoundary/ErrorBoundary.tsx`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Define the observability contract**

Write `docs/operations/incident-triage.md` with:
- what constitutes a crash vs handled error
- where logs go
- what should never be logged
- how to correlate auth/game failures
- who owns response

- [ ] **Step 2: Document the security model**

Write `docs/security/security-model.md` covering:
- trust boundaries
- client-visible secrets vs server-only secrets
- Supabase auth assumptions
- RLS assumptions
- local storage sensitivity
- release-time security checks

- [ ] **Step 3: Create telemetry primitives**

Add:
- `src/lib/telemetry/logger.ts` for dev-gated logging
- `src/lib/telemetry/events.ts` for stable event names and payload typing

- [ ] **Step 4: Wire core runtime surfaces**

Update `src/utils/crashReporting.ts`, `src/components/ErrorBoundary/ErrorBoundary.tsx`, and `src/app/_layout.tsx` so crashes and important lifecycle failures have one documented path instead of ad hoc `console.*`.

- [ ] **Step 5: Commit**

```bash
git add src/utils/crashReporting.ts src/lib/telemetry/events.ts src/lib/telemetry/logger.ts docs/operations/incident-triage.md docs/security/security-model.md src/components/ErrorBoundary/ErrorBoundary.tsx src/app/_layout.tsx
git commit -m "ops: add telemetry primitives and incident documentation"
```

### Task 9: Add Supabase operational verification and safer maintenance scripts

**Files:**
- Create: `scripts/verify-supabase-policies.js`
- Create: `docs/database/migrations-and-seeding.md`
- Modify: `scripts/seed-game.js`
- Modify: `scripts/test-supabase.js`
- Modify: `package.json`

- [ ] **Step 1: Define what “healthy Supabase state” means**

In `docs/database/migrations-and-seeding.md`, add explicit verification steps for:
- schema is current
- RLS is applied
- required tables exist
- seed scripts still match the schema

- [ ] **Step 2: Add a policy/schema verification script**

Create `scripts/verify-supabase-policies.js` to check expected tables and policy names via SQL or metadata queries where practical.

- [ ] **Step 3: Harden existing scripts**

Update `scripts/seed-game.js` and `scripts/test-supabase.js` to:
- validate env first
- print actionable failures
- avoid ambiguous partial-success output

- [ ] **Step 4: Add package entry points**

Update `package.json` with scripts such as:
- `supabase:verify`
- `supabase:seed:game`
- `supabase:test`

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-supabase-policies.js scripts/seed-game.js scripts/test-supabase.js docs/database/migrations-and-seeding.md package.json
git commit -m "ops: add Supabase verification and safer maintenance scripts"
```

### Task 10: Add quality, accessibility, and release-readiness standards

**Files:**
- Create: `docs/quality/accessibility-and-performance.md`
- Modify: `src/components/Button.tsx`
- Modify: `src/components/TextField.tsx`
- Modify: `src/screens/LoginScreen.tsx`
- Modify: `src/screens/SignupScreen.tsx`
- Modify: `src/screens/GamesScreen.tsx`
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Write the quality standard**

In `docs/quality/accessibility-and-performance.md`, define:
- required accessibility labels and roles
- minimum empty/loading/error state expectations
- list rendering expectations
- release-time manual checks for keyboard, focus, and screen-reader behavior

- [ ] **Step 2: Apply baseline accessibility improvements**

Update the highest-traffic surfaces first:
- auth forms
- primary buttons
- games list actions

- [ ] **Step 3: Add contribution rules**

Update `CONTRIBUTING.md` so UI-changing PRs must mention:
- accessibility impact
- loading/error state impact
- whether docs and screenshots were updated

- [ ] **Step 4: Commit**

```bash
git add docs/quality/accessibility-and-performance.md src/components/Button.tsx src/components/TextField.tsx src/screens/LoginScreen.tsx src/screens/SignupScreen.tsx src/screens/GamesScreen.tsx CONTRIBUTING.md
git commit -m "quality: define baseline accessibility and release standards"
```

### Task 11: Archive or remove stale documentation after migration

**Files:**
- Modify or delete: `llm-helpers/project.md`
- Modify or delete: `llm-helpers/implementation-roadmap.md`
- Modify or delete: `Evaluations/*.md`
- Modify: `docs/README.md`
- Modify: `README.md`

- [ ] **Step 1: Identify what remains historically useful**

Keep:
- planning artifacts that explain why key decisions were made

Archive or delete:
- docs that conflict with implemented reality and are not authoritative

- [ ] **Step 2: Add an archive policy note**

In `docs/README.md`, explain which folders are canonical, archival, or evaluator-only.

- [ ] **Step 3: Replace stale content with pointers**

For any file kept for history, add a short banner at the top linking to the canonical replacement in `docs/`.

- [ ] **Step 4: Commit**

```bash
git add llm-helpers/project.md llm-helpers/implementation-roadmap.md Evaluations docs/README.md README.md
git commit -m "docs: archive stale planning and helper materials"
```

---

## Execution Summary

```text
Chunk 1: Documentation Source Of Truth           [2-4 days]  Medium leverage
Chunk 2: Repo Automation And Release Discipline  [2-4 days]  High leverage
Chunk 3: Operational Maturity                    [3-5 days]  High leverage
                                            Total: ~7-13 days
```

### Dependency Graph

```text
Unified Plan Complete
      |
      v
Task 1 -> Task 2 -> Task 3 -> Task 4
  |        |         |
  +------> Task 5 -> Task 6 -> Task 7
                    |
                    v
               Task 8 -> Task 9 -> Task 10 -> Task 11
```

Task 5 can begin once Task 1 defines the canonical env/docs ownership model. Task 6 and Task 7 should not land before Task 4 if they reference scripts or docs that do not yet exist. Task 11 is intentionally last.

## Success Criteria

When this plan is complete, the repo should:

- [ ] Have `docs/` as the explicit source of truth for architecture, operations, security, and development workflows
- [ ] Have a root `README.md` that is accurate, concise, and linked to canonical docs
- [ ] Have a complete `.env.example` and automated env validation
- [ ] Have CI workflows for typecheck, lint, tests, and docs verification
- [ ] Have a documented release runbook and rollback procedure
- [ ] Have stable scripts for release preflight and Supabase verification
- [ ] Have contribution guardrails (`CONTRIBUTING.md`, PR template, CODEOWNERS, dependency automation)
- [ ] Have a documented logging/telemetry policy with core runtime wiring
- [ ] Have explicit accessibility and performance expectations for user-facing changes
- [ ] Have stale helper docs archived, deleted, or clearly marked as non-canonical
- [ ] Allow a new engineer to clone the repo, configure env, run the app, run tests, and understand the release path without reading ad hoc notes

