# VerifiedSpecs Index

35 specs broken out from the unified initial plan and the post-unified repo advancement plan. Each is self-contained and sized for a single subagent.

## Dependency Graph

```
Phase 1: Pre-Flight
  01 ──┐
  02 ──┤
       │
Phase 2: Critical Fixes (all depend on Phase 1)
  03 ──┤
  04 ──┤
  05 ──┤
  06 ──┤
  07 ──┤
       │
Phase 3: Expo SDK Upgrade (depends on Phase 2)
  08 ──┤
       │
Phase 4: Library Upgrades (parallel, depend on 08)
  09 ──┼── (also depends on 03)
  10 ──┤
  11 ──┤
       │
Phase 5: Toolchain Upgrades (parallel, depend on 08)
  12 ──┤
  13 ──┤
       │
Phase 6: Architecture (depends on Phases 4+5)
  14 ──┤
  15 ──┤── (depends on 14)
  16 ──┤── (depends on 14)
  17 ──┤
  18 ──┤
       │
Phase 7: Testing (depends on Phase 6)
  19 ──┤
  20 ──┤
  21 ──┤
  22 ──┤
       │
Phase 8: Documentation & Polish (depends on Phase 7)
  23 ──┤
  24 ──┘
```

## Spec List

### Phase 1: Pre-Flight (< 1 day)
| # | File | Title | Effort |
|---|------|-------|--------|
| 01 | [01-dead-code-removal.md](01-dead-code-removal.md) | Dead Code & Legacy Artifact Removal | < 1 hr |
| 02 | [02-test-infrastructure-baseline.md](02-test-infrastructure-baseline.md) | Fix Test Infrastructure Baseline | < 1 hr |

### Phase 2: Critical Fixes (1-2 days)
| # | File | Title | Effort |
|---|------|-------|--------|
| 03 | [03-mmkv-encryption-hardening.md](03-mmkv-encryption-hardening.md) | MMKV Encryption Key Hardening | 2-4 hrs |
| 04 | [04-rls-policy-game-codes.md](04-rls-policy-game-codes.md) | Restrict RLS Policy for Game Join Codes | 2-3 hrs |
| 05 | [05-auth-mapping-consolidation.md](05-auth-mapping-consolidation.md) | Auth Mapping Consolidation & Token Cleanup | 2-3 hrs |
| 06 | [06-ui-bug-fixes.md](06-ui-bug-fixes.md) | UI Bug Fixes (Debug Colors + Member List) | 1-2 hrs |
| 07 | [07-join-code-uniqueness.md](07-join-code-uniqueness.md) | Join Code Uniqueness & Data Integrity | 2-3 hrs |

### Phase 3: Expo SDK Upgrade (2-3 days)
| # | File | Title | Effort |
|---|------|-------|--------|
| 08 | [08-expo-sdk-55-upgrade.md](08-expo-sdk-55-upgrade.md) | Expo SDK 53 -> 55 | 2-3 days |

### Phase 4: Library Upgrades (2-3 days, parallelizable)
| # | File | Title | Effort |
|---|------|-------|--------|
| 09 | [09-mmkv-v4-upgrade.md](09-mmkv-v4-upgrade.md) | react-native-mmkv 3 -> 4 | 2-4 hrs |
| 10 | [10-flashlist-v2-upgrade.md](10-flashlist-v2-upgrade.md) | @shopify/flash-list 1 -> 2 | < 1 hr |
| 11 | [11-i18next-v26-upgrade.md](11-i18next-v26-upgrade.md) | i18next 23 -> 26 | 1-2 days |

### Phase 5: Toolchain Upgrades (2-3 days, parallelizable)
| # | File | Title | Effort |
|---|------|-------|--------|
| 12 | [12-eslint-flat-config.md](12-eslint-flat-config.md) | ESLint Flat Config Migration | 1-2 days |
| 13 | [13-toolchain-conditional-upgrades.md](13-toolchain-conditional-upgrades.md) | TypeScript 6 + Jest 30 (conditional) | 0.5-1 day each |

### Phase 6: Architecture Refactoring (3-5 days)
| # | File | Title | Effort |
|---|------|-------|--------|
| 14 | [14-split-database-module.md](14-split-database-module.md) | Split Database God Object | 3-5 hrs |
| 15 | [15-typed-error-returns.md](15-typed-error-returns.md) | Typed Error Returns (Replace Silent Nulls) | 4-6 hrs |
| 16 | [16-domain-validation-layer.md](16-domain-validation-layer.md) | Domain Validation Layer | 4-6 hrs |
| 17 | [17-auth-state-consolidation.md](17-auth-state-consolidation.md) | Auth State Consolidation | 2-3 hrs |
| 18 | [18-code-quality-cleanup.md](18-code-quality-cleanup.md) | Console Logging + Theme Consistency | 3-4 hrs |

### Phase 7: Testing Foundation (3-5 days)
| # | File | Title | Effort |
|---|------|-------|--------|
| 19 | [19-test-suite-auth.md](19-test-suite-auth.md) | Test Suite: Auth Store | 3-4 hrs |
| 20 | [20-test-suite-database.md](20-test-suite-database.md) | Test Suite: Database + Validation | 4-6 hrs |
| 21 | [21-test-suite-components.md](21-test-suite-components.md) | Test Suite: Components | 3-4 hrs |
| 22 | [22-e2e-tests-maestro.md](22-e2e-tests-maestro.md) | E2E Tests (Maestro) + CI Coverage | 3-4 hrs |

### Phase 8: Documentation & Polish (1-2 days)
| # | File | Title | Effort |
|---|------|-------|--------|
| 23 | [23-project-documentation.md](23-project-documentation.md) | Project Documentation | 2-3 hrs |
| 24 | [24-post-upgrade-cleanup.md](24-post-upgrade-cleanup.md) | Post-Upgrade Cleanup & Verification | 1-2 days |

## Parallelization Opportunities

- **Specs 01 + 02** can run in parallel (Phase 1)
- **Specs 03, 04, 05, 06, 07** can run in parallel (Phase 2, no interdependencies)
- **Specs 09, 10, 11** can run in parallel (Phase 4, after 08)
- **Specs 12, 13** can run in parallel (Phase 5, after 08)
- **Specs 14, 17, 18** can start in parallel (Phase 6; 15 and 16 depend on 14)
- **Specs 19, 20, 21, 22** can run in parallel (Phase 7)
- **Specs 23 + 24** can run in parallel (Phase 8)

---

## Post-Unified Advancement Specs

These specs assume **Spec 24** is complete, or an equivalent post-unified baseline exists.

### Dependency Graph

```
Post-Unified Foundation
  25 ──┐
       ├──> 26 ──┐
       ├──> 27 ──┤
       └──> 29 ──┼──> 30 ──> 31 ──> 32 ──> 33 ──> 34 ──> 35
                 │
                 └──> 28 ──┘
```

### Phase 9: Documentation Canon (1-2 days)
| # | File | Title | Effort |
|---|------|-------|--------|
| 25 | [25-documentation-canon.md](25-documentation-canon.md) | Documentation Canon, ADR, and Root Navigation | 1-2 hrs |
| 26 | [26-architecture-and-domain-reference.md](26-architecture-and-domain-reference.md) | Architecture and Domain Reference Docs | 2-3 hrs |
| 27 | [27-database-and-supabase-ops-docs.md](27-database-and-supabase-ops-docs.md) | Database and Supabase Operations Docs | 2-3 hrs |
| 28 | [28-developer-onboarding-and-contributor-contract.md](28-developer-onboarding-and-contributor-contract.md) | Developer Onboarding and Contributor Contract | 2-3 hrs |

### Phase 10: Automation and Operations (2-4 days)
| # | File | Title | Effort |
|---|------|-------|--------|
| 29 | [29-env-docs-and-validation.md](29-env-docs-and-validation.md) | Environment Documentation and Validation | 2-3 hrs |
| 30 | [30-ci-docs-and-pr-guardrails.md](30-ci-docs-and-pr-guardrails.md) | CI, Docs Verification, and PR Guardrails | 3-4 hrs |
| 31 | [31-release-operations-and-dependency-stewardship.md](31-release-operations-and-dependency-stewardship.md) | Release Operations and Dependency Stewardship | 3-4 hrs |

### Phase 11: Operational Maturity (2-4 days)
| # | File | Title | Effort |
|---|------|-------|--------|
| 32 | [32-telemetry-and-incident-docs.md](32-telemetry-and-incident-docs.md) | Telemetry, Logging Policy, and Incident Documentation | 3-4 hrs |
| 33 | [33-supabase-verification-and-script-hardening.md](33-supabase-verification-and-script-hardening.md) | Supabase Verification and Script Hardening | 2-3 hrs |
| 34 | [34-accessibility-and-quality-standards.md](34-accessibility-and-quality-standards.md) | Accessibility and Release Quality Standards | 2-3 hrs |
| 35 | [35-archive-legacy-docs.md](35-archive-legacy-docs.md) | Archive and Label Legacy Documentation | 1-2 hrs |

### Additional Parallelization Opportunities

- **Specs 26, 27, and 29** can start after 25 lands
- **Spec 28** can run in parallel with 29 once 25 exists
- **Specs 30 and 31** should wait for 28 and 29 because they rely on scripts and canonical docs
- **Specs 32, 33, and 34** are partially parallel after 31, but 33 should land before final release docs are treated as trustworthy
- **Spec 35** is intentionally last so it archives stale material only after canonical replacements exist
