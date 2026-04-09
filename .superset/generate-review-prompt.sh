#!/usr/bin/env bash
# Generates .superset/REVIEW_PROMPT.md for the reviewer workspace.
# Usage: generate-review-prompt.sh <builder-branch>
set -euo pipefail

BUILDER_BRANCH="${1:?builder branch name required}"
BASE_BRANCH="${BASE_BRANCH:-main}"
OUT=".superset/REVIEW_PROMPT.md"

echo "  Generating review prompt: $BUILDER_BRANCH vs $BASE_BRANCH"

if ! git show-ref --verify --quiet "refs/remotes/origin/$BUILDER_BRANCH" && \
   ! git show-ref --verify --quiet "refs/heads/$BUILDER_BRANCH"; then
  echo "  ⚠ Branch '$BUILDER_BRANCH' not found locally or in origin."
  echo "  Attempting fetch..."
  git fetch origin "$BUILDER_BRANCH" 2>/dev/null || {
    echo "  ✗ Could not find branch. Is the builder workspace committed/pushed?"
    exit 1
  }
fi

DIFF=$(git diff "$BASE_BRANCH"..."$BUILDER_BRANCH" -- 2>/dev/null)
STAT=$(git diff --stat "$BASE_BRANCH"..."$BUILDER_BRANCH" -- 2>/dev/null)
COMMITS=$(git log --oneline "$BASE_BRANCH".."$BUILDER_BRANCH" 2>/dev/null)

cat > "$OUT" <<PROMPT
# Code Review: \`$BUILDER_BRANCH\`

You are performing an **adversarial code review** of the branch \`$BUILDER_BRANCH\`
against \`$BASE_BRANCH\`. Your job is not to be agreeable — it is to find problems.

## Your mandate

- Find bugs, including subtle ones that won't show up in happy-path testing
- Identify missing edge cases and untested scenarios
- Flag security issues, including anything that touches auth, user input, or data boundaries
- Call out deviations from existing project patterns and conventions
- Note anything that will become technical debt or slow the team down
- Question unnecessary complexity — if something is harder to read than it needs to be, say so

## What you are NOT doing

- Praising what works (assume it works unless you find otherwise)
- Providing a balanced summary — skew critical
- Suggesting minor style nitpicks unless they indicate a deeper problem

## Commits in this branch

\`\`\`
$COMMITS
\`\`\`

## Changed files

\`\`\`
$STAT
\`\`\`

## Full diff

\`\`\`diff
$DIFF
\`\`\`

## Output format

For each issue found, use:

**[SEVERITY]** \`path/to/file.ts:line\`
> Brief description of the problem and why it matters.
> Suggested fix or direction if obvious.

Severity levels: **CRITICAL** | **HIGH** | **MEDIUM** | **LOW**

End with a one-line verdict: **PASS**, **PASS WITH CONCERNS**, or **NEEDS WORK**.
PROMPT

echo "  ✓ Review prompt written to $OUT"
