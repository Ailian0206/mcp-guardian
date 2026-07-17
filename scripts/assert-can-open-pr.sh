#!/usr/bin/env bash
# 开 PR 前必须跑：挡住「没事就提 PR」。仅里程碑 + 开放 PR=0 才允许。
# 用法：bash scripts/assert-can-open-pr.sh
# 强制放行（极少）：ALLOW_OPEN_PR=1 bash scripts/assert-can-open-pr.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "${ALLOW_OPEN_PR:-}" == "1" ]]; then
  echo "ALLOW_OPEN_PR=1：跳过里程碑检查（仍建议确认开放 PR≤1）"
fi

OPEN_COUNT="$(gh pr list --state open --json number -q 'length')"
if [[ "$OPEN_COUNT" != "0" ]]; then
  echo "拒绝开 PR：已有 $OPEN_COUNT 个开放 PR（上限 1）。先合完再开。" >&2
  gh pr list --state open
  exit 1
fi

if [[ "${ALLOW_OPEN_PR:-}" == "1" ]]; then
  exit 0
fi

cat <<'EOF' >&2
拒绝默认开 PR。本仓库规则：

  - 只有「里程碑」才允许开 PR（整周/大切片验收完成，或用户书面批准）
  - 禁止按天、按小修复、纯文档、状态面板单独开 PR
  - 日常在功能分支 commit/push 即可，不要开 PR

若确认是里程碑，执行：
  ALLOW_OPEN_PR=1 bash scripts/assert-can-open-pr.sh
  然后再 gh pr create …
EOF
exit 2
