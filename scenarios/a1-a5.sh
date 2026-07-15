#!/usr/bin/env bash
# A1–A5：读允许、写拒绝、HTTP 脱敏、shell 需审批、审批通过
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
pnpm build >/dev/null
CLI=(node packages/gateway/dist/cli.js)
POLICY="$ROOT/policies/default.fail-closed.yaml"

# A1
ALLOW="$("${CLI[@]}" eval --policy "$POLICY" --server demo-fs --tool read_file --args '{"path":"/workspace/a.txt"}')"
echo "$ALLOW" | grep -q '"action": "allow"'

# A2
DENY_CODE=0
"${CLI[@]}" eval --policy "$POLICY" --server demo-fs --tool write_file --args '{"path":"/etc/passwd","content":"x"}' >/tmp/mg-a2.json || DENY_CODE=$?
test "$DENY_CODE" -eq 1
grep -q '"action": "deny"' /tmp/mg-a2.json

# A3 redact — 输出不得含明文假密钥
REDACT="$("${CLI[@]}" eval --policy "$POLICY" --server demo-http --tool fetch --args '{"url":"https://api.example.com?api_key=sk-live-secret","headers":{"authorization":"Bearer sk-live-secret"}}')"
echo "$REDACT" | grep -q '"action": "redact"'
echo "$REDACT" | grep -q '\*\*\*REDACTED\*\*\*'
! echo "$REDACT" | grep -q 'sk-live-secret'

# A4 require_approval
APR="$("${CLI[@]}" eval --policy "$POLICY" --server demo-shell --tool run --args '{"command":"rm -rf /tmp/x"}')"
echo "$APR" | grep -q '"action": "require_approval"'

# A5 approval decide
export MCP_GUARDIAN_HOME
MCP_GUARDIAN_HOME="$(mktemp -d)"
node --input-type=module -e "
import { ApprovalStore } from './packages/gateway/dist/approvals.js';
const s = new ApprovalStore(process.env.MCP_GUARDIAN_HOME + '/state.db');
s.create({
  id: 'scenario-a5',
  server: 'demo-shell',
  tool: 'run',
  argsRedacted: { command: 'rm -rf /tmp/x' },
  reasons: ['test'],
  ttlSeconds: 60,
});
s.close();
"
"${CLI[@]}" approvals decide scenario-a5 --allow | grep -q '"status": "approved"'
rm -rf "$MCP_GUARDIAN_HOME"

echo "A1-A5 OK"
