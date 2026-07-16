#!/usr/bin/env bash
# 开发 agent 用：触发 Claude /pr-review，等待审核信号，门禁通过后自动 merge。
# 审核本身只读，由 Claude Code 执行；本脚本不冒充审核评论或改标签。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PR="${1:-}"
if [[ -z "$PR" ]]; then
  PR="$(gh pr list --state open --json number --jq '.[0].number' 2>/dev/null || true)"
fi
if [[ -z "$PR" || "$PR" == "null" ]]; then
  echo "用法: $0 <PR编号>  （或存在唯一开放 PR 时省略）" >&2
  exit 1
fi

# 审核协议路径：命中则必须用可信基线模式
PROTOCOL_PATHS=(
  '.claude/skills/pr-review/'
  '.cursor/rules/pr-review-gate.mdc'
  'AGENT.md'
  'AGENTS.md'
  'docs/github-automation-playbook.md'
  'docs/bugbot-autofix-workflow.md'
)

read -r BASE_OID HEAD_OID HEAD_BRANCH < <(
  gh pr view "$PR" --json baseRefOid,headRefOid,headRefName \
    --jq '[.baseRefOid,.headRefOid,.headRefName] | @tsv'
)

needs_trusted_base() {
  local files
  files="$(gh pr view "$PR" --json files --jq '.files[].path')"
  for p in "${PROTOCOL_PATHS[@]}"; do
    if echo "$files" | grep -qF "$p"; then
      return 0
    fi
  done
  return 1
}

run_pr_review() {
  if ! command -v claude >/dev/null 2>&1; then
    echo "未找到 claude CLI，请安装 Claude Code 后重试" >&2
    exit 1
  fi
  if needs_trusted_base; then
    local wt=".worktrees/pr-review-base-${PR}-${BASE_OID:0:7}"
    if [[ ! -d "$wt" ]]; then
      git worktree add --detach "$wt" "$BASE_OID"
    fi
    echo "触发可信基线审核: /pr-review --trusted-base $PR"
    (cd "$wt" && claude --permission-mode auto --model sonnet -p "/pr-review --trusted-base $PR")
    # clean detached worktree 可删
    if [[ -z "$(git -C "$wt" status --porcelain 2>/dev/null)" ]]; then
      git worktree remove "$wt" 2>/dev/null || true
    fi
  else
    echo "触发普通审核: /pr-review"
    claude --permission-mode auto --model sonnet -p "/pr-review"
  fi
}

marker_for_head() {
  gh pr view "$PR" --json comments \
    --jq "[.comments[].body | capture(\"<!-- CLAUDE_REVIEWED_SHA: (?<sha>[0-9a-f]+) -->\") | .sha] | index(\"$HEAD_OID\") != null"
}

has_label() {
  local name="$1"
  gh pr view "$PR" --json labels \
    --jq "[.labels[].name] | index(\"$name\") != null"
}

wait_for_review() {
  local i max="${PR_REVIEW_WAIT_MAX:-90}"
  for ((i = 1; i <= max; i++)); do
    HEAD_OID="$(gh pr view "$PR" --json headRefOid --jq -r '.headRefOid')"
    if has_label "claude-changes-requested"; then
      echo "存在 claude-changes-requested，请在分支 $HEAD_BRANCH 修复后 push，再重新运行本脚本" >&2
      exit 2
    fi
    if has_label "claude-reviewed" && [[ "$(marker_for_head)" == "true" ]]; then
      echo "审核通过: claude-reviewed + marker 匹配 $HEAD_OID"
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
  echo "检查 GitHub CI..."
  local checks
  checks="$(gh pr checks "$PR" 2>&1 || true)"
  echo "$checks"
  if ! echo "$checks" | grep -q pass; then
    echo "CI 未通过" >&2
    exit 4
  fi
}

merge_pr() {
  if [[ "$(gh pr view "$PR" --json isDraft --jq -r '.isDraft')" == "true" ]]; then
    gh pr ready "$PR"
  fi
  gh pr merge "$PR" --merge --delete-branch
  echo "已合并 PR #$PR"
}

SKIP_REVIEW="${SKIP_PR_REVIEW:-}"
if [[ "$SKIP_REVIEW" != "1" ]]; then
  # 已有当前 head 的 marker 则跳过重复触发
  HEAD_OID="$(gh pr view "$PR" --json headRefOid --jq -r '.headRefOid')"
  if [[ "$(marker_for_head)" != "true" ]]; then
    run_pr_review
  else
    echo "当前 head 已有 CLAUDE_REVIEWED_SHA，跳过重复触发审核"
  fi
  wait_for_review
else
  echo "SKIP_PR_REVIEW=1，跳过触发/等待审核"
fi

ensure_gates
merge_pr
