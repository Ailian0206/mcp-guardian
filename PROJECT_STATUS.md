# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-15  
当前阶段：**方案已锁定，等待 Evidence Graph 公开演示门槛后启动 Week 0/1**  
决策源：`docs/product-plan.md`

## 1. 当前目标

完成产品宪法、四周推进计划与架构冻结；不开始业务功能编码，直到启动门槛满足。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 产品总方案 | 已完成 | `docs/product-plan.md` |
| 四周推进计划 | 已完成 | `docs/development-plan.md` |
| 架构说明 | 已完成 | `docs/architecture.md` |
| Monorepo 脚手架 | 未开始 | Week 0 |
| Policy Engine | 未开始 | Week 1 |
| Gateway CLI | 未开始 | Week 1–2 |
| Demo Servers | 未开始 | Week 1–2 |
| Web Dashboard | 未开始 | Week 3 |
| 红队 / 公开 Demo | 未开始 | Week 4 |
| 作品集包装 | 未开始 | Week 5 |

## 3. 启动门槛

- [ ] Evidence Graph 可公开演示研究闭环  
- [ ] 本仓库 GitHub remote 就绪  
- [ ] Node 22 + pnpm 可用  

## 4. 下一步

1. EG 达门槛后执行 `docs/development-plan.md` Week 0。  
2. 任何功能请求先写入 `docs/p1-backlog.md`（创建于启动后）。  

## 5. 冻结的 P0 动作

`allow` / `deny` / `redact` / `require_approval` —— 详见产品方案 §4.1。
