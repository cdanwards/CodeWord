#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${SUPERSET_WORKSPACE_NAME:-unnamed}"
ROOT="${SUPERSET_ROOT_PATH:-.}"

echo "🔧 Setting up workspace: $WORKSPACE"

# --- Env ---
if [ -f "$ROOT/.env" ]; then
  cp "$ROOT/.env" .env
  echo "  ✓ .env copied"
fi

# --- Deps ---
if [ -f "bun.lock" ] || [ -f "bun.lockb" ]; then
  bun install --frozen-lockfile
elif [ -f "package-lock.json" ]; then
  npm ci
elif [ -f "yarn.lock" ]; then
  yarn install --frozen-lockfile
fi
echo "  ✓ deps installed"

# --- Detect workspace role from name ---
# Convention: reviewer workspaces are named "review/<builder-branch>"
# e.g. a workspace named "review/feat-auth" will review the branch "feat-auth"
if [[ "$WORKSPACE" == review/* ]]; then
  BUILDER_BRANCH="${WORKSPACE#review/}"
  echo "  → Reviewer mode detected. Target branch: $BUILDER_BRANCH"
  ./.superset/generate-review-prompt.sh "$BUILDER_BRANCH"
else
  echo "  → Builder mode. No review prompt generated."
fi

echo "✅ Workspace ready"
