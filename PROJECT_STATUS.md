# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-15  
当前阶段：**Week 1 已合并；下一周期 Week 2（审批 + demo-shell/http）**  
仓库：<https://github.com/Ailian0206/mcp-guardian>  
决策源：`docs/product-plan.md`

## 1. 当前目标

Week 2：CLI/本地审批、`demo-shell`、`demo-http`、A3–A5 场景闭环。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| GitHub + Week 0 | 已完成 | PR #1 |
| Policy Engine | 已完成 | PR #2，21 单测 |
| Gateway eval/start | 已完成 | stdio 代理 + SQLite 审计 |
| Demo FS | 已完成 | A1/A2 通过 |
| 审批队列 | 未开始 | Week 2 |
| Demo shell/http | 未开始 | Week 2 |
| Web Dashboard | 未开始 | Week 3 |

## 3. 已合并 PR

- #1 Week 0 monorepo / CI  
- #2 Week 1 policy-engine / gateway  

## 4. 验证命令

```bash
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a2.sh
```
