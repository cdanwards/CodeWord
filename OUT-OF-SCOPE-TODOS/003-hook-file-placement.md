# TODO: Hook Config File Placement

**Source:** PR #3 adversarial review
**Severity:** LOW
**Introduced in:** PR #1 / PR #2 (already on `main`)

## Problem

`.github/hooks/superset-notify.json` is Superset-specific configuration placed under `.github/`. The `.github/` directory conventionally holds GitHub Actions, issue templates, and similar GitHub-native config — not third-party tool configuration.

## Suggested Fix

- Move to `.superset/hooks/` to keep tool-specific config co-located
- Update any references that point to the current path

## Related Specs

- Spec 25 (Documentation Canon) — establishes file organization conventions
- Spec 33 (Supabase Verification and Script Hardening) — reviews script/config placement
