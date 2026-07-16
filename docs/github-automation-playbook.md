# GitHub 使用与自动化最佳实践

仓库：`Ailian0206/mcp-guardian`  
可见性：Public  
默认分支：`main`  
工具：`git` + `gh` + Claude Code `/pr-review`（替代 Cursor Bugbot）

## 1. 核心原则（成本优先）

1. **严控 PR 数量**：同时最多 1 个开放 PR；整周验收后再开。  
2. **按「开发计划整周」或更大交付切片开 PR**，不要按天/按小任务开。  
3. **纯文档 / 状态面板 / playbook 单独不配开 PR**，并入下一周功能 PR。  
4. **审核由独立 Claude `/pr-review` 完成**；开发 agent 不得自审自批。  
5. **主进程不干等**：审核进行时可继续本地下一切片，但**先不开第二个 PR**。  
6. Cursor Bugbot 额度耗尽期间**不再**作为合并门禁。

### 1.1 数量红线（强制）

| 规则 | 要求 |
| --- | --- |
| 开放 PR 上限 | **≤ 1**（含 Draft） |
| 最小开 PR 粒度 | 至少完成 `development-plan` 里 **一整周**验收，或用户明确批准的更大切片 |
| 禁止单独开 PR | 纯 `docs/`、`PROJECT_STATUS`、AGENT/playbook、拼写/格式 |
| 仓库起步例外 | 仅允许 **1 次** bootstrap PR（建仓+CI）；之后不得再拆「脚手架 PR / 文档 PR / 小功能 PR」 |

## 2. 日常闭环

```text
main
  → 拉大切片分支 feat/weekN-...
  → 分支内多日小步 commit（可 push 远程备份，仍不开 PR）
  → 整周验收通过（lint/typecheck/test/场景）
  → 确认当前没有其它开放 PR
  → 开唯一 PR（可 Draft）
  → 触发 Claude /pr-review（协议变更用 --trusted-base）
  → 有 claude-changes-requested → 同分支修复 → push → 复审
  → 标签与 marker 通过 + CI 绿 → gh pr merge --merge --delete-branch
  → （可选）主进程在审核期间本地开发下一周，等合并后再开 PR
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

### 3.3 修复循环

1. 读取 PR 评论中的 CRITICAL/HIGH，用测试或复现命令验证。  
2. 认可则同分支最小修复；不认可则在回复/状态中写明拒绝理由（不迎合）。  
3. `pnpm lint && pnpm typecheck && pnpm test`（及必要场景）通过后 push。  
4. 重新触发对应模式的 `/pr-review`。  
5. 直到 `claude-reviewed` 且无 `claude-changes-requested`，且 marker == 当前 head。

MEDIUM/LOW 由开发 agent 技术判断，不要求人工。

### 3.4 自动合并（无需人工批准）

同时满足：

1. 本地门禁绿  
2. GitHub CI 绿  
3. `claude-reviewed` 且 marker 匹配当前 `headRefOid`  
4. 无 `claude-changes-requested`  
5. 无未解决的有效 CRITICAL/HIGH  

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

- 自主完成周期内模块 → 唯一 PR → Claude 审核 → 自动修复/复审 → 自动合并。  
- 不静默开启下一**开发周期**（周期级仍需用户授权）；周期内下一**模块**可并行开发但不开第二 PR。  
- 密钥、npm publish、生产部署、高风险不可逆操作先确认。

## 6. 配置入口

- Claude skill：`.claude/skills/pr-review/SKILL.md`（全局备份：`~/.claude/skills/pr-review/`）  
- Cursor 门禁：`.cursor/rules/pr-review-gate.mdc`  
- 旧 Bugbot Dashboard（仅参考，不再作为门禁）：<https://www.cursor.com/dashboard/bugbot>
