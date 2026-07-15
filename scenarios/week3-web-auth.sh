#!/usr/bin/env bash
# Week3：公开 demo 可访问；/app 未登录应跳转登录
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT=3040
DATA="$(mktemp -d)"
export MCP_GUARDIAN_WEB_DATA="$DATA"

pnpm --filter @mcp-guardian/web build >/dev/null
pnpm --filter @mcp-guardian/web exec next start --port "$PORT" >/tmp/mg-web.log 2>&1 &
PID=$!
cleanup() { kill "$PID" >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

for i in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:$PORT/" >/dev/null; then break; fi
  sleep 0.25
done

curl -sf "http://127.0.0.1:$PORT/" | grep -q "MCP Guardian"
curl -sf "http://127.0.0.1:$PORT/demo" | grep -q "公开 Demo"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/app")
# Next redirect to login
test "$CODE" = "307" -o "$CODE" = "302" -o "$CODE" = "303"

# login then reach dashboard
curl -sf -c /tmp/mg-cookies.txt -b /tmp/mg-cookies.txt \
  -X POST "http://127.0.0.1:$PORT/api/auth/login" \
  -d "displayName=week3-tester" -o /dev/null -D /tmp/mg-login.hdr
curl -sf -b /tmp/mg-cookies.txt "http://127.0.0.1:$PORT/app" | grep -q "Dashboard"

echo "Week3 web auth OK"
