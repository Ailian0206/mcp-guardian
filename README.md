# MCP Guardian

AI Agent 调用 MCP 工具前的权限、脱敏、审批与审计网关。

> 状态：产品方案已锁定，工程实施等待启动门槛（见 `PROJECT_STATUS.md`）。

## 文档

| 文档 | 说明 |
| --- | --- |
| [产品总方案](docs/product-plan.md) | 定位、范围、技术决策、成功标准（决策源） |
| [四周推进计划](docs/development-plan.md) | Week 0–5 交付与验收 |
| [架构说明](docs/architecture.md) | 包边界、时序、错误码、配置 |

## 一句话

不是 Trace 平台，而是 **MCP `tools/call` 的调用前策略执行层**。

## 与作品集其它项目

- `ai-photo-studio-cn`：多模态 C 端 SaaS  
- `evidence-graph`：可追溯研究 Agent  
- `mcp-guardian`：Agent 工具安全网关  

## 快速开始

工程脚手架尚未创建。启动后将提供：

```bash
pnpm install
pnpm --filter gateway start
```

以及 Cursor `mcp.json` 配置示例。

## License

MIT（仓库初始化时写入）
