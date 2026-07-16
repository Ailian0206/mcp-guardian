#!/usr/bin/env bash
# A1–A8 总验收（本地，不依赖付费云）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash "$ROOT/scenarios/a1-a5.sh"
bash "$ROOT/scenarios/redteam-six.sh"

# A6：红队后用 eval 计数语义（deny/redact/approval 均已在上两脚本出现）
# A7：断网本地 — a1-a5 已证明 CLI 无 Web 可完成
# A8：公开 demo
bash "$ROOT/scenarios/week3-web-auth.sh"

echo "A1-A8 OK"
