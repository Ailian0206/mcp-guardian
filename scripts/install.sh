#!/usr/bin/env bash
# 一键：依赖 + 构建 + 写入 Cursor/Codex MCP 配置
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "需要 pnpm。可执行: corepack enable && corepack prepare pnpm@9.15.9 --activate" >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "需要 Node.js >= 22" >&2
  exit 1
fi

echo "==> pnpm install"
pnpm install

echo "==> pnpm build"
pnpm build

TARGETS=()
if [[ "${1:-}" == "--cursor" ]]; then TARGETS=(--cursor)
elif [[ "${1:-}" == "--codex" ]]; then TARGETS=(--codex)
else TARGETS=(--all)
fi

echo "==> 写入 MCP 客户端配置"
node "$ROOT/packages/gateway/dist/cli.js" install "${TARGETS[@]}"

echo ""
echo "完成。下一步："
echo "  1. 重启 Cursor / Codex（或 Reload MCP）"
echo "  2. 在 MCP 列表确认出现 mcp-guardian"
echo "  3. 让 Agent 调用 demo-fs 工具；危险操作用："
echo "       pnpm guardian approvals list"
echo "       pnpm guardian approvals decide <id> --allow"
echo "  Web（可选演示）: pnpm dev:web → http://127.0.0.1:3040"
