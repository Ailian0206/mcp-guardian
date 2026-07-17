#!/usr/bin/env bash
# 开发 agent 用：Claude /pr-review 只审一次 →（有问题则先修再）本地+CI 绿 → merge。
# 审核本身只读，由 Claude Code 执行；本脚本不冒充审核评论或改标签。
# 不复审：出现 changes-requested 时修完后设 SKIP_PR_REVIEW=1 再跑本脚本即可合并。
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
    echo "触发可信基线审核（仅一次）: /pr-review --trusted-base $PR"
    (cd "$wt" && claude --permission-mode auto --model sonnet -p "/pr-review --trusted-base $PR")
    if [[ -z "$(git -C "$wt" status --porcelain 2>/dev/null)" ]]; then
      git worktree remove "$wt" 2>/dev/null || true
    fi
  else
    echo "触发普通审核（仅一次）: /pr-review"
    claude --permission-mode auto --model sonnet -p "/pr-review"
  fi
}

# 任一评论里出现过 CLAUDE_REVIEWED_SHA 即视为「已审过一次」（修完不要求匹配新 head）
ever_reviewed() {
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

# 等 Claude 落标签；通过或要求修改都算「审完一次」
wait_for_one_review() {
  local i max="${PR_REVIEW_WAIT_MAX:-90}"
  for ((i = 1; i <= max; i++)); do
    if has_label "claude-reviewed" || has_label "claude-changes-requested" || ever_reviewed; then
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
if [[ "$SKIP_REVIEW" != "1" ]]; then
  if ever_reviewed || has_label "claude-reviewed" || has_label "claude-changes-requested"; then
    echo "本 PR 已审过一次，跳过复审（修完直接走本地+CI+merge）"
  else
    run_pr_review
    wait_for_one_review
  fi

  # 有修改意见：停下来让开发 agent 修；修完用 SKIP_PR_REVIEW=1 再跑合并
  if has_label "claude-changes-requested"; then
    echo "存在 claude-changes-requested：请按评论修 → push → 再执行：" >&2
    echo "  SKIP_PR_REVIEW=1 bash scripts/pr-gate.sh $PR" >&2
    echo "（不再触发第二次 /pr-review）" >&2
    exit 2
  fi
else
  echo "SKIP_PR_REVIEW=1：跳过审核，直接门禁+合并"
fi

ensure_gates
merge_pr
