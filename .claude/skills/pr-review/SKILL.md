---
name: pr-review
description: 用于审核刚创建或更新的 PR，以及检查缺少当前 head SHA 审核 marker 的开放 PR。
---

# PR 独立只读审核（MCP Guardian）

本 skill 在 Cursor Bugbot 不可用时承担审核职责。它只发现和报告问题，修复由开发 agent 完成。

## 调用模式

```text
/pr-review
/pr-review --trusted-base <PR编号>
```

- 普通模式：从当前 PR 工作区审核不涉及审核协议的开放 PR。
- 可信基线模式：从目标 PR 的准确 `baseRefOid` detached worktree 审核涉及审核协议的 PR。

## 代码只读硬边界

允许：

- 使用 `gh pr list/view/diff`、`gh api`、Read、Grep、`codegraph_*` 读取信息。
- 运行不会修改仓库的验证命令或临时脚本。
- 发布 PR inline/summary 评论和维护审核标签。

禁止：

- 编辑或写入 tracked 文件。
- commit、push、创建分支、创建/关闭/合并 PR。
- checkout 目标 PR head。
- 在可信基线模式执行、复制或导入目标分支代码。
- 直接修复 finding。

## 审核状态协议

每条 summary 评论必须以当前 PR head SHA marker 结尾：

```html
<!-- CLAUDE_REVIEWED_SHA: <head-sha> -->
```

标签语义：

- `claude-reviewed`：当前 head SHA 的审核已完成。
- `claude-changes-requested`：当前审核存在未解决的 CRITICAL/HIGH finding。

如果最新 marker SHA 等于当前 head SHA，必须幂等跳过，不发新评论、不改标签。新 head SHA 必须重新审核。只有审核器可以维护这两个标签。

## 审核协议路径

任一变更命中以下路径，就必须使用可信基线模式：

- `.claude/skills/pr-review/**`
- `.cursor/rules/pr-review-gate.mdc`
- `AGENT.md` 中的 PR 审核/合并门禁
- `docs/github-automation-playbook.md` 中的审核协议
- `docs/bugbot-autofix-workflow.md`

普通模式发现这些路径时必须零 GitHub 写入退出，并明确要求开发 agent 从 `baseRefOid` worktree 运行：

```bash
claude --permission-mode auto --model sonnet -p "/pr-review --trusted-base <PR编号>"
```

## 普通模式

1. 查询开放 PR：

   ```bash
   gh pr list --state open --json number,headRefOid,baseRefOid,title,isDraft,url
   ```

2. 读取每个 PR 的 issue 评论，查找最新 `CLAUDE_REVIEWED_SHA`。
3. SHA 已匹配时跳过。
4. 读取变更文件列表；命中审核协议路径时按上一节退出，不得评论或加标签。
5. 其余 PR 进入“共同审核过程”。

## 可信基线模式

只允许指定一个 PR。开始审核前按顺序验证：

1. 参数包含有效正整数 PR 编号。
2. 读取目标状态：

   ```bash
   gh pr view <PR编号> --json state,baseRefOid,headRefOid,title,isDraft,url
   ```

3. `state` 必须是 `OPEN`。
4. `baseRefOid` 和 `headRefOid` 必须存在且不同。
5. 当前 HEAD 必须等于 `baseRefOid`：

   ```bash
   test "$(git rev-parse HEAD)" = "<baseRefOid>"
   ```

6. 当前必须是 detached HEAD；`git symbolic-ref -q HEAD` 成功表示校验失败。
7. 任一校验失败时输出稳定原因并立即退出；不得发布评论或修改标签。
8. marker 已匹配 `headRefOid` 时幂等退出。

可信基线模式读取目标内容时只能使用：

- `gh pr diff <PR编号>` 获取完整 patch。
- `gh api repos/{owner}/{repo}/contents/{path}?ref=<headRefOid>` 获取目标 head 的完整文件。
- `gh api` 读取评论、review 和 metadata。
- 当前 base worktree 中未被修改的基线上下文。

不得 checkout、fetch 到工作区、执行目标分支测试或从目标分支加载 skill。

## 共同审核过程

1. 完整读取 `gh pr diff <PR编号>`。
2. 对策略引擎、Gateway、审批/审计 store、Auth、sync API 等高风险文件读取完整文件；普通模式可读工作区文件，可信基线模式必须用 GitHub Contents API 读取目标 head。
3. 不确定库行为时先做只读实证，禁止凭记忆报告。
4. 按以下等级输出：

   | 等级 | 含义 | 合并影响 |
   | --- | --- | --- |
   | CRITICAL | 安全漏洞或数据丢失风险 | 阻塞 |
   | HIGH | 明确 bug 或重大质量问题 | 阻塞 |
   | MEDIUM | 可维护性或非阻塞质量问题 | 自动判断 |
   | LOW | 样式、小风险或记录项 | 可选 |

5. 必查类别：密钥泄露、路径穿越、fail-open 误用、审批绕过、审计覆盖/丢失、ownership 绕过、静默吞错、无界查询、缺失行为测试。
6. 可精确定位的 finding 使用 inline 评论；每个问题一条。评论包含错误、可复现场景和修复方向，不提供完整 diff。
7. 始终发布一条 summary，列出全部 finding、最终结论和准确 SHA marker。
8. 如果仓库缺少审核标签，可创建缺少的标签；不得改变已有标签的颜色或说明。
9. 审核完成后添加 `claude-reviewed`。有 CRITICAL/HIGH 时添加 `claude-changes-requested`；后续干净审核必须移除它。
10. 立即退出，不等待开发 agent，不重复审核同一 SHA。

## 项目约束

- Draft PR 也必须审核。
- GitHub 作者身份不能区分 Codex、Cursor 或用户，所有待审核 PR 都按相同规则处理。
- 忽略 `.worktrees/` 中与目标 PR 无关的历史 checkout。
- 本仓库首次引入本 skill 的 PR 允许使用全局 `~/.claude/skills/pr-review` 作为 bootstrap；合并后后续协议 PR 必须走可信基线模式。
