# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-15  
当前阶段：**Week 1 policy-engine / gateway 推进中**  
仓库：<https://github.com/Ailian0206/mcp-guardian>  
决策源：`docs/product-plan.md`

## 1. 当前目标

完成 Week 1：YAML 策略评估、demo-fs、`mcp-guardian eval/start`、本地 SQLite 审计；验收 A1/A2。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 产品总方案 | 已完成 | `docs/product-plan.md` |
| GitHub 仓库 | 已完成 | Public，CI 已通 |
| Week 0 Monorepo | 已完成 | PR #1 已 merge |
| Policy Engine | 进行中 | ≥20 单测，fail-closed / redact / approval 匹配 |
| Gateway CLI | 进行中 | `eval` / `start` / `audits list` |
| Demo FS | 进行中 | `packages/demo-servers` stdio server |
| 审批队列 | 未开始 | Week 2（start 对 require_approval 暂拒绝） |
| Web Dashboard | 未开始 | Week 3 |

## 3. 当前开发周期（Week 1）

1. shared Zod schema  
2. policy-engine 真实评估 + 默认策略文件  
3. demo-fs + gateway proxy + SQLite 审计  
4. Draft PR → CI → merge  

## 4. 验证

```bash
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a2.sh
```

## 5. 下一步（Week 1 合并后）

Week 2：CLI/本地审批、demo-shell、demo-http、A3–A5。
