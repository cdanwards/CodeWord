# Spec 32: Telemetry, Logging Policy, and Incident Documentation

**Phase:** 11.1 (Operational Maturity)
**Priority:** Medium
**Effort:** 3-4 hours
**Dependencies:** Spec 31
**Blocked by:** Release operations baseline

---

## Objective

Replace ad hoc runtime diagnostics with a documented observability contract. This spec defines what gets logged, what gets reported, what must never be emitted, and wires a minimal shared telemetry surface into the highest-level runtime boundaries.

---

## Required Changes

### 1. Document incident handling and logging policy

**Files:**
- `docs/operations/incident-triage.md`
- `docs/security/security-model.md`

Define:
- crash vs handled error
- expected logging destinations
- data that must never be logged
- trust boundaries for client vs server-visible data
- how auth and gameplay incidents should be triaged

### 2. Create shared telemetry primitives

**Files:**
- `src/lib/telemetry/logger.ts`
- `src/lib/telemetry/events.ts`

Responsibilities:
- centralize dev logging policy
- define stable event names and payload shapes
- make future instrumentation less ad hoc

### 3. Wire top-level runtime boundaries

**Files:**
- `src/utils/crashReporting.ts`
- `src/components/ErrorBoundary/ErrorBoundary.tsx`
- `src/app/_layout.tsx`

Responsibilities:
- funnel unexpected errors into the shared crash-reporting path
- remove ambiguity about where top-level failures are surfaced
- make development-only logging explicit

---

## Files Changed

| File | Change |
|------|--------|
| `docs/operations/incident-triage.md` | New incident triage guide |
| `docs/security/security-model.md` | New security/telemetry boundary doc |
| `src/lib/telemetry/logger.ts` | New shared logging utility |
| `src/lib/telemetry/events.ts` | New event-name and payload definitions |
| `src/utils/crashReporting.ts` | Align crash reporting with documented policy |
| `src/components/ErrorBoundary/ErrorBoundary.tsx` | Route top-level component failures through shared policy |
| `src/app/_layout.tsx` | Apply top-level lifecycle instrumentation policy |

---

## Acceptance Criteria

- [ ] Incident triage and logging policy are documented
- [ ] Security model explicitly states what must never be logged or exposed
- [ ] Shared telemetry primitives exist under `src/lib/telemetry/`
- [ ] Top-level runtime surfaces use the shared logging/crash path
- [ ] Development-only logs are explicit and production-safe

---

## Risks

- **Over-instrumentation:** This spec should create primitives and top-level policy, not scatter event tracking everywhere.
- **Security leakage:** Logging policy must be reviewed carefully so no auth/session details are emitted.

