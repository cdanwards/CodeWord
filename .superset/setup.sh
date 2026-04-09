#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${SUPERSET_WORKSPACE_NAME:-unnamed}"
ROOT="${SUPERSET_ROOT_PATH:-.}"

echo "🔧 Setting up workspace: $WORKSPACE"

# --- Env ---
if [ -f "$ROOT/.env" ]; then
  cp "$ROOT/.env" .env
  echo "  ✓ .env copied"
elif [ -f "$ROOT/.env.example" ]; then
  cp "$ROOT/.env.example" .env
  echo "  ✓ .env created from .env.example"
else
  echo "  ✗ Missing environment configuration: expected $ROOT/.env or $ROOT/.env.example" >&2
  echo "    app.config.ts relies on SUPABASE_* variables, so workspace setup cannot continue." >&2
  exit 1
fi

# --- Deps ---
deps_installed=false
deps_manager=""
if [ -f "bun.lock" ] || [ -f "bun.lockb" ]; then
  bun install --frozen-lockfile
  deps_installed=true
  deps_manager="bun"
elif [ -f "package-lock.json" ]; then
  npm ci
  deps_installed=true
  deps_manager="npm"
elif [ -f "yarn.lock" ]; then
  yarn install --frozen-lockfile
  deps_installed=true
  deps_manager="yarn"
fi
if [ "$deps_installed" = true ]; then
  echo "  ✓ deps installed ($deps_manager)"
else
  echo "  ⚠ no supported lockfile found; skipping dependency install"
fi

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
