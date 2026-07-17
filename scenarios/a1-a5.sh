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

# A4 require_approval（策略层；运行时由 Agent 会话内 guardian_decide 完成 A5）
APR="$("${CLI[@]}" eval --policy "$POLICY" --server demo-shell --tool run --args '{"command":"rm -rf /tmp/x"}')"
echo "$APR" | grep -q '"action": "require_approval"'

# A5：会话内审批契约 — pending 含 confirm_code；allow 必须码一致
node --input-type=module -e "
import {
  confirmCodeOk,
  pendingApprovalPayload,
} from './packages/gateway/dist/pending-cache.js';
const call = {
  id: 'scenario-a5',
  server: 'demo-shell',
  tool: 'run',
  forwardArgs: { command: 'rm -rf /tmp/x' },
  decision: {
    action: 'require_approval',
    risk: 99,
    matched_rule_id: 'approve-dangerous-shell',
    reasons: ['test'],
    redacted_args: { command: 'rm -rf /tmp/x' },
    mode: 'fail_closed',
  },
  createdAt: new Date().toISOString(),
  confirmCode: 'deadbe',
};
const text = pendingApprovalPayload(call, 300);
if (!text.includes('guardian_decide') || !text.includes('approval_required') || !text.includes('confirm_code')) {
  process.exit(1);
}
if (!confirmCodeOk(call, 'allow', 'deadbe') || confirmCodeOk(call, 'allow', 'nope')) {
  process.exit(1);
}
"

echo "A1-A5 OK"
