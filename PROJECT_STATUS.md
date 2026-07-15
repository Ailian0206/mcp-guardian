# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-15  
当前阶段：**Week 2 实现中（分支 feat/week2-approvals，验收后才开 PR）**  
仓库：<https://github.com/Ailian0206/mcp-guardian>  
决策源：`docs/product-plan.md`  
Bugbot 流程：`docs/github-automation-playbook.md`

## 1. 当前目标

Week 2：CLI 审批、demo-shell/http、A1–A5。模块验收通过后再开 **唯一** Draft PR。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| Week 0/1 | 已完成 | PR #1 #2 |
| Bugbot 流程文档 | PR 中 | #4（子代理监听中） |
| 审批队列 | 本地完成 | ApprovalStore + TTL + CLI decide |
| demo-shell / http | 本地完成 | 模拟执行 / 回显 fetch |
| A1–A5 场景 | 本地通过 | `scenarios/a1-a5.sh` |
| Web Dashboard | 未开始 | Week 3 |

## 3. 本地验证（开 PR 前门禁）

```bash
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a5.sh
```

## 4. Bugbot 规则提醒

- 本模块未验收完成前 **不开 PR**
- 开 PR 后派子代理听 Autofix，主进程做下一模块
- 禁止与 Autofix 抢修
