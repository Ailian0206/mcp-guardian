#!/usr/bin/env bash
# 开发 agent 用：Claude /pr-review **每个 PR 生涯只触发一次** → 修完不复审 → 本地+CI 绿 → merge。
# 成本红线：禁止并发；已审过则绝不启动第二次 claude；修完用 SKIP_PR_REVIEW=1。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PR="${1:-}"
if [[ -z "$PR" ]]; then
  PR="$(gh pr list --state open --json number -q '.[0].number' 2>/dev/null || true)"
fi
if [[ -z "$PR" || "$PR" == "null" ]]; then
  echo "用法: $0 <PR编号>  （或存在唯一开放 PR 时省略）" >&2
  exit 1
fi

# 单飞锁（mkdir 原子锁，兼容无 flock 的 macOS）：防多路并行 /pr-review
LOCK_DIR="${TMPDIR:-/tmp}/mcp-guardian-pr-gate-pr-${PR}.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "PR #$PR 的 pr-gate 已在运行（$LOCK_DIR）。禁止并发审核。" >&2
  exit 5
fi
cleanup_lock() { rmdir "$LOCK_DIR" 2>/dev/null || true; }
trap cleanup_lock EXIT

# 仅改「审核协议本体」才走 trusted-base；勿因改 AGENT/playbook 正文就强制昂贵模式
PROTOCOL_PATHS=(
  '.claude/skills/pr-review/'
  '.cursor/rules/pr-review-gate.mdc'
)

read -r BASE_OID HEAD_OID HEAD_BRANCH < <(
  gh pr view "$PR" --json baseRefOid,headRefOid,headRefName \
    -q '[.baseRefOid,.headRefOid,.headRefName] | @tsv'
)

needs_trusted_base() {
  local files
  files="$(gh pr view "$PR" --json files -q '.files[].path')"
  for p in "${PROTOCOL_PATHS[@]}"; do
    if echo "$files" | grep -qF "$p"; then
      return 0
    fi
  done
  return 1
}

# 任一历史 marker / 审核标签 = 本 PR 已审过一次（与 head 是否前进无关）
ever_reviewed() {
  if has_label "claude-reviewed" || has_label "claude-changes-requested"; then
    return 0
  fi
  [[ "$(
    gh pr view "$PR" --json comments \
      -q '[.comments[].body | select(test("CLAUDE_REVIEWED_SHA"))] | length > 0'
  )" == "true" ]]
}

has_label() {
  local name="$1"
  [[ "$(
    gh pr view "$PR" --json labels \
      -q "[.labels[].name] | index(\"$name\") != null"
  )" == "true" ]]
}

run_pr_review() {
  if ever_reviewed; then
    echo "拒绝启动 Claude：PR #$PR 已有审核记录。禁止复审烧额度。" >&2
    exit 6
  fi
  if ! command -v claude >/dev/null 2>&1; then
    echo "未找到 claude CLI，请安装 Claude Code 后重试" >&2
    exit 1
  fi
  if needs_trusted_base; then
    local wt=".worktrees/pr-review-base-${PR}-${BASE_OID:0:7}"
    if [[ ! -d "$wt" ]]; then
      git worktree add --detach "$wt" "$BASE_OID"
    fi
    echo "触发可信基线审核（本 PR 唯一一次）: /pr-review --trusted-base $PR"
    (cd "$wt" && claude --permission-mode auto --model sonnet -p "/pr-review --trusted-base $PR")
    if [[ -z "$(git -C "$wt" status --porcelain 2>/dev/null)" ]]; then
      git worktree remove "$wt" 2>/dev/null || true
    fi
  else
    echo "触发普通审核（本 PR 唯一一次）: /pr-review"
    claude --permission-mode auto --model sonnet -p "/pr-review"
  fi
}

# 等 Claude 落标签；缩短默认等待，避免空转
wait_for_one_review() {
  local i max="${PR_REVIEW_WAIT_MAX:-36}"
  for ((i = 1; i <= max; i++)); do
    if ever_reviewed; then
      echo "Claude 已完成一次审核"
      return 0
    fi
    sleep 10
  done
  echo "等待 Claude 审核超时（${max}×10s）" >&2
  exit 3
}

ensure_gates() {
  echo "运行本地门禁..."
  pnpm lint && pnpm typecheck && pnpm test
  echo "等待 GitHub CI..."
  if ! gh pr checks "$PR" --watch --fail-fast; then
    echo "CI 未通过" >&2
    exit 4
  fi
}

merge_pr() {
  if [[ "$(gh pr view "$PR" --json isDraft -q '.isDraft')" == "true" ]]; then
    gh pr ready "$PR"
  fi
  gh pr merge "$PR" --merge --delete-branch
  echo "已合并 PR #$PR"
}

SKIP_REVIEW="${SKIP_PR_REVIEW:-}"
if [[ "$SKIP_REVIEW" == "1" ]]; then
  echo "SKIP_PR_REVIEW=1：跳过审核，直接门禁+合并"
  ensure_gates
  merge_pr
  exit 0
fi

if ever_reviewed; then
  if has_label "claude-changes-requested"; then
    echo "已审过且有修改意见：请按评论修 → push → 再执行：" >&2
    echo "  SKIP_PR_REVIEW=1 bash scripts/pr-gate.sh $PR" >&2
    echo "（禁止再次 /pr-review）" >&2
    exit 2
  fi
  echo "本 PR 已审过一次且无 changes-requested，跳过 Claude，直接门禁+merge"
  ensure_gates
  merge_pr
  exit 0
fi

run_pr_review
wait_for_one_review

if has_label "claude-changes-requested"; then
  echo "存在 claude-changes-requested：请按评论修 → push → 再执行：" >&2
  echo "  SKIP_PR_REVIEW=1 bash scripts/pr-gate.sh $PR" >&2
  echo "（禁止第二次 /pr-review）" >&2
  exit 2
fi

ensure_gates
merge_pr
