# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-15  
当前阶段：**Week 0 monorepo 脚手架推进中**  
仓库：`Ailian0206/mcp-guardian`（创建后填写 URL）  
决策源：`docs/product-plan.md`

## 1. 当前目标

完成 GitHub 仓库与 Week 0 验收：`pnpm lint && pnpm typecheck && pnpm test` 本地与 CI 全绿。

用户已授权按开发计划直接推进；Evidence Graph 公开演示门槛改为不阻塞工程脚手架与 Week 1。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 产品总方案 | 已完成 | `docs/product-plan.md` |
| 四周推进计划 | 已完成 | `docs/development-plan.md` |
| 架构说明 | 已完成 | `docs/architecture.md` |
| GitHub 仓库 | 进行中 | 本模块创建与推送 |
| Monorepo 脚手架 | 进行中 | pnpm workspace + CI |
| Policy Engine | 未开始 | Week 1 |
| Gateway CLI | 未开始 | Week 1–2 |
| Demo Servers | 未开始 | Week 1–2 |
| Web Dashboard | 未开始 | Week 3 |
| 红队 / 公开 Demo | 未开始 | Week 4 |

## 3. 当前开发周期（Week 0）

模块清单：

1. 创建公开 GitHub 仓库 + LICENSE/AGENT/流程文档  
2. pnpm monorepo 五包脚手架 + Vitest/ESLint/tsc  
3. GitHub Actions CI  
4. Draft PR → CI 绿 → merge commit 回 main  

周期终止：Week 0 合并后更新本面板，再开 `feat/week1-policy-engine`。

## 4. 下一步

- 合并 Week 0 PR  
- 启动 Week 1：shared Zod schema + policy-engine 真实评估 + demo-fs  
