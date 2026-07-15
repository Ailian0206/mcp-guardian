# MCP Guardian

AI Agent 调用 MCP 工具前的权限、脱敏、审批与审计网关。

仓库：<https://github.com/Ailian0206/mcp-guardian>

## 状态

Week 0 monorepo 脚手架。决策源见 [`docs/product-plan.md`](docs/product-plan.md)。

## 包结构

```text
apps/web                 Dashboard / 落地页（Week 3 升级 Next.js）
packages/gateway         本地 MCP 代理 CLI
packages/policy-engine   策略评估
packages/shared          共享类型
packages/demo-servers    红队演示 MCP Server
```

## 开发

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

## 文档

| 文档 | 说明 |
| --- | --- |
| [产品总方案](docs/product-plan.md) | 决策源 |
| [四周推进计划](docs/development-plan.md) | Week 0–5 |
| [架构说明](docs/architecture.md) | 包边界与错误码 |
| [GitHub 流程](docs/github-automation-playbook.md) | 分支 / PR / 合并 |

## License

MIT
