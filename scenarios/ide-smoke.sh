#!/usr/bin/env bash
# IDE 主路径冒烟：MCP Client 连本机 Gateway，验 allow/deny/redact/审批+confirm_code。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh" && nvm use 22 >/dev/null 2>&1 || true

pnpm --filter @mcp-guardian/demo-servers build >/dev/null
pnpm --filter @mcp-guardian/gateway build >/dev/null

SMOKE_HOME="$(mktemp -d /tmp/mg-ide-smoke-XXXXXX)"
cleanup() { rm -rf "$SMOKE_HOME"; }
trap cleanup EXIT
export MCP_GUARDIAN_HOME="$SMOKE_HOME"

export MG_SMOKE_CONFIG
MG_SMOKE_CONFIG="$(
  node --input-type=module -e "
import { writeUserConfig, detectRepoRoot } from './packages/gateway/dist/install-client.js';
process.stdout.write(writeUserConfig(detectRepoRoot()));
"
)"
export MG_SMOKE_CLI="$ROOT/packages/gateway/dist/cli.js"
test -f "$MG_SMOKE_CONFIG"
grep -q demo-shell "$MG_SMOKE_CONFIG"
grep -q demo-http "$MG_SMOKE_CONFIG"

node "$ROOT/packages/gateway/dist/ide-smoke.js"
