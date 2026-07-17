# GitHub 使用与自动化最佳实践

仓库：`Ailian0206/mcp-guardian`  
可见性：Public  
默认分支：`main`  
工具：`git` + `gh` + Claude Code `/pr-review`（替代 Cursor Bugbot）

## 1. 核心原则（成本优先）

1. **严控 PR 数量**：同时最多 1 个开放 PR；**只有里程碑意义才开**（不要频繁开 PR）。  
2. **按「整周 / 大切片 / 里程碑」开 PR**，不要按天、按小修复、按单文档开。  
3. **纯文档 / 状态面板 / playbook 单独不配开 PR**，并入当前里程碑 PR。  
4. **Claude `/pr-review` 只审一次**；开发 agent 不得自审自批、不得冒充审核。  
5. **有问题**：Claude 评论 → 开发 agent 按评论修 → push → **不再复审** → 本地+CI 绿直接 merge。  
6. **没问题**：本地+CI 绿直接 merge。  
7. Cursor Bugbot 额度耗尽期间**不再**作为合并门禁。

### 1.1 数量红线（强制）

| 规则 | 要求 |
| --- | --- |
| 开放 PR 上限 | **≤ 1**（含 Draft） |
| 最小开 PR 粒度 | **有里程碑意义**（整周验收 / 用户批准的大切片）；禁止频繁开 PR |
| 禁止单独开 PR | 纯 `docs/`、`PROJECT_STATUS`、AGENT/playbook、拼写/格式 |
| 仓库起步例外 | 仅允许 **1 次** bootstrap PR（建仓+CI）；之后不得再拆「脚手架 PR / 文档 PR / 小功能 PR」 |
| Claude 审核 | **每个 PR 只审一次**；修完不复审 |

## 2. 日常闭环

```text
main
  → 拉里程碑分支 feat/...
  → 分支内多日小步 commit（可 push 远程备份，仍不开 PR）
  → 里程碑验收通过（lint/typecheck/test/场景）
  → 确认当前没有其它开放 PR
  → 开唯一 PR
  → Claude /pr-review 只审一次（协议变更用 --trusted-base）
  → 有问题：按评论修 → push → 不再复审
  → 本地门禁 + CI 绿 → gh pr merge --merge --delete-branch
```

### 2.1 何时才允许开 PR

必须同时满足：

- 当前开放 PR 数量为 0  
- 已完成至少一个完整 Week（或用户书面批准的等价大切片）  
- 本地完整门禁已绿：`pnpm lint && pnpm typecheck && pnpm test`（及该周场景脚本）  
- `PROJECT_STATUS.md` 已写清本周验收与不做项  
- 相关文档改动已一并打进同一分支（不另开 docs PR）

### 2.2 分支命名

| 类型 | 格式 |
| --- | --- |
| 功能 | `feat/<topic>` |
| 修复 | `fix/<topic>` |
| 文档 | `docs/<topic>` |
| CI | `ci/<topic>` |

`main` 只接受已通过门禁的模块 PR，禁止直接推送业务改动。

## 3. Claude `/pr-review` 协作

### 3.1 触发命令

普通 PR（未改审核协议）：

```bash
claude --permission-mode auto --model sonnet -p "/pr-review"
```

触及审核协议路径（`.claude/skills/pr-review/**`、`.cursor/rules/pr-review-gate.mdc`、`AGENT.md` 门禁、本 playbook 审核协议、`docs/bugbot-autofix-workflow.md` 等）时：

```bash
git worktree add --detach ".worktrees/pr-review-base-<PR>-<base短SHA>" "<baseRefOid>"
cd ".worktrees/pr-review-base-<PR>-<base短SHA>"
claude --permission-mode auto --model sonnet -p "/pr-review --trusted-base <PR>"
# 退出后确认 worktree clean，再 remove（禁止 --force 清脏树）
```

### 3.2 标签与 marker

| 信号 | 含义 |
| --- | --- |
| `claude-reviewed` | 当前审核已完成 |
| `claude-changes-requested` | 存在未解决 CRITICAL/HIGH |
| `<!-- CLAUDE_REVIEWED_SHA: <sha> -->` | summary 评论中的 head SHA 幂等标记 |

开发 agent **不得**手工增删这两个标签，也不得冒充审核评论。

### 3.3 有问题：修一次就合（不复审）

1. 读取 PR 评论中的 CRITICAL/HIGH，用测试或复现命令验证。  
2. 认可则同分支最小修复；不认可则在回复中写明拒绝理由（不迎合）。  
3. `pnpm lint && pnpm typecheck && pnpm test`（及必要场景）通过后 push。  
4. **不再触发** `/pr-review`。  
5. 本地门禁 + CI 绿后直接 merge：

```bash
SKIP_PR_REVIEW=1 bash scripts/pr-gate.sh <PR编号>
```

MEDIUM/LOW 由开发 agent 技术判断，不要求人工。

### 3.4 自动合并（无需人工批准）

**没问题路径**：Claude 一次审完无阻塞项 + 本地门禁绿 + CI 绿 → merge。  
**有问题路径**：按评论修完 + 本地门禁绿 + CI 绿 → merge（**不要求**再次 `claude-reviewed` / 新 head marker）。

```bash
bash scripts/pr-gate.sh <PR编号>                 # 首次：触发一次审核后合并
SKIP_PR_REVIEW=1 bash scripts/pr-gate.sh <PR编号>  # 已按评论修好：跳过审核直接合
```

或手动：

```bash
gh pr ready <n>
gh pr merge <n> --merge --delete-branch
```

禁止 squash / rebase / force push。

## 4. PR 模板要点

- 变更内容 / 原因 / 影响范围 / 验证命令 / 风险点  
- 写明：本模块验收已完成；开 PR 后由 Claude `/pr-review` 审核  
- 合并方式固定为 merge commit  

## 5. Agent 边界

- 自主完成里程碑 → 唯一 PR → Claude **只审一次** →（有问题则修）→ 自动合并。  
- **不要频繁开 PR**；周期内小步可 commit/push，但不开第二 PR。  
- 密钥、npm publish、生产部署、高风险不可逆操作先确认。

## 6. 配置入口

- Claude skill：`.claude/skills/pr-review/SKILL.md`（全局备份：`~/.claude/skills/pr-review/`）  
- Cursor 门禁：`.cursor/rules/pr-review-gate.mdc`  
- 旧 Bugbot Dashboard（仅参考，不再作为门禁）：<https://www.cursor.com/dashboard/bugbot>
