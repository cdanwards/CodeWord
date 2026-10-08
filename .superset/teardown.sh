#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${SUPERSET_WORKSPACE_NAME:-unnamed}"

echo "🧹 Tearing down workspace: $WORKSPACE"

if [ -f ".superset/REVIEW_PROMPT.md" ]; then
  rm .superset/REVIEW_PROMPT.md
  echo "  ✓ Review prompt cleaned up"
fi

echo "✅ Teardown complete"
