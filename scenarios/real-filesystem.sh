#!/usr/bin/env bash
# 真实下游：官方 Filesystem MCP 经 Gateway（读放行 / 系统写拒绝 / 工作区写需批）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh" && nvm use 22 >/dev/null 2>&1 || true

pnpm --filter @mcp-guardian/gateway build >/dev/null

SMOKE_HOME="$(mktemp -d /tmp/mg-real-fs-XXXXXX)"
WS="$SMOKE_HOME/workspace"
mkdir -p "$WS"
cleanup() { rm -rf "$SMOKE_HOME"; }
trap cleanup EXIT
export MCP_GUARDIAN_HOME="$SMOKE_HOME"

export MG_SMOKE_CONFIG MG_SMOKE_WORKSPACE
MG_SMOKE_WORKSPACE="$WS"
MG_SMOKE_CONFIG="$(
  node --input-type=module -e "
import { writeUserConfig, detectRepoRoot } from './packages/gateway/dist/install-client.js';
process.stdout.write(writeUserConfig(detectRepoRoot(), {
  profile: 'filesystem',
  workspace: process.env.MG_SMOKE_WORKSPACE,
}));
"
)"
export MG_SMOKE_CLI="$ROOT/packages/gateway/dist/cli.js"
grep -q '@modelcontextprotocol/server-filesystem' "$MG_SMOKE_CONFIG"
grep -q filesystem.fail-closed "$MG_SMOKE_CONFIG"

# 策略层快速断言（不启下游）
POLICY="$ROOT/policies/filesystem.fail-closed.yaml"
node "$MG_SMOKE_CLI" eval --policy "$POLICY" --server filesystem --tool read_text_file --args "{\"path\":\"$WS/a.txt\"}" | grep -q '"action": "allow"'
node "$MG_SMOKE_CLI" eval --policy "$POLICY" --server filesystem --tool write_file --args '{"path":"/etc/passwd","content":"x"}' >/tmp/mg-fs-deny.json || true
grep -q '"action": "deny"' /tmp/mg-fs-deny.json
node "$MG_SMOKE_CLI" eval --policy "$POLICY" --server filesystem --tool write_file --args "{\"path\":\"$WS/out.txt\",\"content\":\"x\"}" | grep -q '"action": "require_approval"'

node "$ROOT/packages/gateway/dist/real-fs-smoke.js"
