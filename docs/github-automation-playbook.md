# GitHub 使用与自动化最佳实践

仓库：`Ailian0206/mcp-guardian`  
工具：`git` + `gh` + Claude Code `/pr-review`（**替代** Bugbot；Bugbot 禁止再用）

## 1. 成本优先（血泪约束）

一次 PR 并行打出多路 Claude 审核，会在数十分钟内烧掉大量 5 小时额度。因此：

1. **没事禁止开 PR**；只有里程碑才开。  
2. **开放 PR ≤ 1**。  
3. **Claude 每个 PR 只审一次**；修完不复审。  
4. **禁止并发** `pr-gate` / `/pr-review`（`scripts/pr-gate.sh` 用 flock）。  
5. 开 PR 前必须过：`bash scripts/assert-can-open-pr.sh`。  
6. 本仓 agent **不得**去其他仓库开 PR / 跑审核。

### 1.1 数量红线

| 规则 | 要求 |
| --- | --- |
| 开放 PR | **≤ 1** |
| 开 PR 粒度 | **仅里程碑** |
| 禁止单独开 PR | 纯 docs / PROJECT_STATUS / playbook 小改 / 拼写 |
| Claude | **每 PR 1 次**；已有 marker/标签则拒绝对第二次 |

## 2. 日常闭环

```text
main → 里程碑分支（多日 commit，可 push，不开 PR）
  → 验收绿
  → assert-can-open-pr.sh + ALLOW_OPEN_PR=1
  → 开唯一 PR
  → pr-gate.sh（内部 Claude 只启动一次）
  → 有问题：修 → SKIP_PR_REVIEW=1 → merge
  → 没问题：门禁绿 → merge
```

### 2.1 何时才允许开 PR

- 开放 PR = 0  
- 完整 Week / 用户批准的大切片已验收  
- `pnpm lint && pnpm typecheck && pnpm test`（及场景）已绿  
- `ALLOW_OPEN_PR=1` 显式确认

## 3. Claude `/pr-review`

### 3.1 触发（唯一入口）

```bash
bash scripts/pr-gate.sh <PR>                 # 未审过：启动唯一一次 Claude
SKIP_PR_REVIEW=1 bash scripts/pr-gate.sh <PR>  # 已审过并修好：禁止再开 Claude
```

不要手动连开多次 `claude -p "/pr-review"`。

### 3.2 trusted-base 收窄

仅当 diff 命中：

- `.claude/skills/pr-review/**`
- `.cursor/rules/pr-review-gate.mdc`

才用 `--trusted-base`。改 AGENT/playbook 文案不再强制昂贵模式。

### 3.3 有问题：修一次就合

读评论 → 修 → 本地+CI 绿 → `SKIP_PR_REVIEW=1` merge。**禁止**为验证修复再跑 `/pr-review`。

## 4. Agent 边界

- 只动 `mcp-guardian`。  
- 密钥 / npm publish / 生产部署先问用户。

## 5. 配置入口

- 仓内 skill：`.claude/skills/pr-review/SKILL.md`  
- 全局备份：`~/.claude/skills/pr-review/SKILL.md`（须与仓内一致）  
- Cursor 规则：`.cursor/rules/pr-review-gate.mdc`
