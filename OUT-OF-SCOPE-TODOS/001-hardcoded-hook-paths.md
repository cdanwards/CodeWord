# TODO: Hardcoded Absolute Paths in Hook Config

**Source:** PR #3 adversarial review
**Severity:** CRITICAL
**Introduced in:** PR #1 / PR #2 (already on `main`)

## Problem

`.github/hooks/superset-notify.json` contains hardcoded absolute paths in all four hook entries:

```
/Users/danedwards/.superset/hooks/copilot-hook.sh
```

This breaks on any machine other than the original author's and leaks the local username into the committed tree.

## Suggested Fix

- Replace absolute paths with `$HOME`-relative or repository-relative paths
- Or move the config out of the committed tree into `.superset/` (which is likely gitignored or machine-local)

## Related Specs

- Spec 30 (CI, Docs Verification, and PR Guardrails) may cover this tangentially
- Spec 33 (Supabase Verification and Script Hardening) touches script paths
