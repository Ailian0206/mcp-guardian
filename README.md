# MCP Guardian

AI Agent 调用 MCP 工具前的权限、脱敏、审批与审计网关。

仓库：<https://github.com/Ailian0206/mcp-guardian>

## 状态

Week 1：策略引擎与最小 Gateway。决策源见 [`docs/product-plan.md`](docs/product-plan.md)。

## 包结构

```text
apps/web                 Dashboard / 落地页（Week 3 升级 Next.js）
packages/gateway         本地 MCP 代理 CLI
packages/policy-engine   策略评估
packages/shared          共享类型
packages/demo-servers    红队演示 MCP Server
policies/                默认 fail-closed 策略
```

## 开发

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test
pnpm build

# A1/A2：允许工作区读 / 拒绝系统写
pnpm guardian eval --policy policies/default.fail-closed.yaml \
  --server demo-fs --tool read_file --args '{"path":"/workspace/a.txt"}'

bash scenarios/a1-a2.sh
```

## Cursor 接入示例

先 `pnpm build`，再在 MCP 配置中指向 Gateway（示例）：

```json
{
  "mcpServers": {
    "guardian-demo-fs": {
      "command": "node",
      "args": [
        "/ABS/PATH/mcp-guardian/packages/gateway/dist/cli.js",
        "start",
        "--config",
        "/ABS/PATH/mcp-guardian/mcp-guardian.config.yaml"
      ]
    }
  }
}
```

下游 `demo-fs` 由配置文件启动；危险写路径会被策略 `deny`。

## 文档

| 文档 | 说明 |
| --- | --- |
| [产品总方案](docs/product-plan.md) | 决策源 |
| [四周推进计划](docs/development-plan.md) | Week 0–5 |
| [架构说明](docs/architecture.md) | 包边界与错误码 |
| [GitHub 流程](docs/github-automation-playbook.md) | 分支 / PR / 合并 |

## License

MIT
