#!/usr/bin/env bash
# A1/A2 场景：策略允许工作区读、拒绝系统写
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
pnpm build >/dev/null
ALLOW="$(node packages/gateway/dist/cli.js eval --policy "$ROOT/policies/default.fail-closed.yaml" --server demo-fs --tool read_file --args '{"path":"/workspace/a.txt"}')"
echo "$ALLOW" | grep -q '"action": "allow"'
DENY_CODE=0
node packages/gateway/dist/cli.js eval --policy "$ROOT/policies/default.fail-closed.yaml" --server demo-fs --tool write_file --args '{"path":"/etc/passwd","content":"x"}' >/tmp/mg-deny.json || DENY_CODE=$?
test "$DENY_CODE" -eq 1
grep -q '"action": "deny"' /tmp/mg-deny.json
echo "A1/A2 OK"
