---
name: pr-review
description: 对 mcp-guardian 的开放 PR 做一次独立只读审核。每个 PR 生涯只审一次；禁止复审、禁止并发、禁止为新 head 再开一轮。
---

# PR 独立只读审核（MCP Guardian）

替代 Cursor Bugbot。只发现和报告问题；修复由开发 agent 完成。

## 成本红线（最高优先级）

1. **每个 PR 只审一次**。评论里已有任意 `CLAUDE_REVIEWED_SHA`，或已有 `claude-reviewed` / `claude-changes-requested` → **立即退出**，不发新评论、不改标签、不读 diff。
2. **禁止**因 head 前进、修复 push、pr-gate 重跑而复审。
3. **禁止**并行启动第二个 `/pr-review`（同一 PR）。
4. **禁止**扫描「所有缺 marker 的 PR」并批量审核；一次调用只处理用户指定的那一个开放 PR（普通模式若有多个开放 PR，只审编号最小的一个，且若它已审过则退出）。
5. 优先 `gh pr diff`；高风险文件按需用 Contents API，禁止无目的整仓拉取。

## 调用模式

```text
/pr-review
/pr-review --trusted-base <PR编号>
```

- 普通：当前工作区；未改审核协议 skill/规则时用这个。
- 可信基线：仅当 diff **命中** `.claude/skills/pr-review/**` 或 `.cursor/rules/pr-review-gate.mdc` 时使用。

## 代码只读硬边界

允许：`gh pr list/view/diff`、`gh api`、Read、Grep、只读验证。

禁止：改 tracked 文件、commit/push、开/关/合 PR、checkout 目标 head、在 trusted-base 执行目标分支代码、直接修 finding。

## 审核状态协议

Summary 结尾：

```html
<!-- CLAUDE_REVIEWED_SHA: <head-sha> -->
```

- `claude-reviewed`：本次（也是本 PR 唯一一次）审核完成。
- `claude-changes-requested`：存在未解决 CRITICAL/HIGH。

**幂等**：本 PR 任意历史 marker / 上述标签已存在 → 跳过（**不要求** marker 等于当前 head）。

只有本审核器可维护这两个标签。

## 审核协议路径（才强制 trusted-base）

- `.claude/skills/pr-review/**`
- `.cursor/rules/pr-review-gate.mdc`

普通模式若命中上述路径：零 GitHub 写入退出，提示开发 agent 用 trusted-base。  
**注意**：改 `AGENT.md` / playbook 文案 **不**再强制 trusted-base（避免无意义烧额度）。

## 普通模式

1. `gh pr list --state open ...`；取编号最小的一个开放 PR。
2. 若已审过（marker 或标签）→ 退出。
3. 命中协议路径 → 退出并要求 trusted-base。
4. 否则进入共同审核过程（一次）。

## 可信基线模式

只审参数指定的一个 PR。校验 OPEN、`baseRefOid`、detached HEAD=`baseRefOid`。  
已审过 → 立即退出。  
读目标：只用 `gh pr diff` + 必要的 Contents API。

## 共同审核过程

1. 读完整 `gh pr diff`。
2. 策略/Gateway/审批等高风险点按需读全文。
3. 等级：CRITICAL/HIGH 阻塞；MEDIUM/LOW 记录。
4. 必查：密钥、路径穿越、fail-open、审批绕过、审计、ownership、吞错、无界查询、缺测。
5. inline + 一条 summary + marker；设标签；**立即退出**，不轮询、不复审。

## 项目约束

- Draft 也审（仍只一次）。
- 忽略无关 `.worktrees/`。
