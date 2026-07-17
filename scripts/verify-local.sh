#!/usr/bin/env bash
# 本地交付前自检：失败则 exit != 0，禁止「半成品交付」
set -euo pipefail
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1090
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
NODE_BIN="$(dirname "$(command -v node)")"
export PATH="$NODE_BIN:/usr/bin:/bin:/usr/sbin:/sbin"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAIL=0
ok(){ echo "OK  $*"; }
bad(){ echo "FAIL $*"; FAIL=$((FAIL+1)); }

echo "node=$(command -v node) $(node -v) pnpm=$(command -v pnpm)"

echo "=== HTTP (需 3040 已启动最新 build) ==="
for path in / /faq /demo /login; do
  code=$(curl -sS -o /tmp/mg-p.html -w "%{http_code}" "http://127.0.0.1:3040${path}" || echo err)
  if [[ "$code" == "200" ]]; then ok "${path} ${code}"; else bad "${path} ${code}"; fi
done
code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:3040/app" || echo err)
if [[ "$code" == "307" || "$code" == "302" || "$code" == "303" ]]; then ok "/app ${code}"; else bad "/app ${code}"; fi
curl -sS http://127.0.0.1:3040/faq | grep -q '<h1>常见问题</h1>' && ok "faq h1" || bad "faq h1"
curl -sS http://127.0.0.1:3040/ | grep -q '一键安装' && ok "home install" || bad "home install"
curl -sS http://127.0.0.1:3040/demo | grep -q '现场试跑' && ok "demo live" || bad "demo live"
out=$(curl -sS -X POST http://127.0.0.1:3040/api/demo/eval -H 'content-type: application/json' \
  -d '{"server":"demo-fs","tool":"write_file","args":{"path":"/etc/passwd","content":"x"}}')
echo "$out" | grep -q '"action":"deny"' && ok "eval deny" || bad "eval deny"

echo "=== lint/typecheck/test/scenarios/e2e ==="
pnpm lint && ok lint || bad lint
pnpm typecheck && ok typecheck || bad typecheck
pnpm test && ok test || bad test
bash scenarios/a1-a8.sh && ok a1-a8 || bad a1-a8
bash scenarios/ide-smoke.sh && ok ide-smoke || bad ide-smoke
bash scenarios/real-filesystem.sh && ok real-filesystem || bad real-filesystem
CI=1 pnpm --filter @mcp-guardian/web exec playwright test && ok e2e || bad e2e

echo "=== install artifacts ==="
test -f packages/gateway/dist/cli.js && ok dist/cli.js || bad dist/cli.js
test -f packages/gateway/dist/pending-cache.js && ok pending-cache.js || bad pending-cache.js
test -f "$HOME/.mcp-guardian/mcp-guardian.config.yaml" && ok user-config || bad user-config
node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(process.env.HOME+'/.cursor/mcp.json','utf8')); if(!d.mcpServers['mcp-guardian']) process.exit(1)" && ok cursor-entry || bad cursor-entry
node packages/gateway/dist/cli.js install --cursor >/tmp/mg-inst.txt && ok reinstall-cursor || bad reinstall-cursor
grep -q demo-shell "$HOME/.mcp-guardian/mcp-guardian.config.yaml" && ok config-shell || bad config-shell
grep -q demo-http "$HOME/.mcp-guardian/mcp-guardian.config.yaml" && ok config-http || bad config-http

echo "=== FAIL_COUNT=$FAIL ==="
if [[ "$FAIL" -ne 0 ]]; then
  echo "交付门禁未通过：修完前不要声称可用。"
fi
exit "$FAIL"
