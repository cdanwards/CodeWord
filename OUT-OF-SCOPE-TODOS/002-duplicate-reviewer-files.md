# TODO: Duplicate Reviewer Instruction Files

**Source:** PR #3 adversarial review
**Severity:** MEDIUM
**Introduced in:** PR #2 (already on `main`)

## Problem

Three files contain byte-identical reviewer instructions:

- `AGENTS.md`
- `GEMINI.md`
- `.github/copilot-instructions.md`

Maintaining three copies invites drift. If one is updated and the others aren't, agents will receive inconsistent instructions.

## Suggested Fix

- Pick one canonical location (e.g., `AGENTS.md` or `.github/copilot-instructions.md`)
- Have the other files reference the canonical one, or delete them if the agent platform supports a single config path

## Related Specs

- Spec 25 (Documentation Canon) — establishes canonical doc locations
- Spec 28 (Developer Onboarding and Contributor Contract) — defines where instructions live
