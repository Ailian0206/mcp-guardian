# MCP Guardian

AI Agent 调用 MCP 工具前的权限、脱敏、审批与审计网关。

仓库：<https://github.com/Ailian0206/mcp-guardian>  
English summary: [`README.en.md`](README.en.md)

## 状态

**Week 4 MVP（本地验收）**：策略引擎 + Gateway + 审批 + Web Dashboard + 红队套件 + Playwright smoke。  
公开 Production URL 待部署；见 [`docs/case-study.md`](docs/case-study.md)。

## 它解决什么

在 `tools/call` **之前** 做 allow / deny / redact / require_approval，并留下可回放审计。  
这不是 Langfuse / LangSmith 一类的 Trace 平台（事后观测）。

## 包结构

```text
apps/web                 落地页 / Demo / Dashboard（Next.js）
packages/gateway         本地 MCP 代理 CLI
packages/policy-engine   策略评估
packages/shared          共享类型
packages/demo-servers    红队演示 MCP Server
policies/                默认 fail-closed 策略
scenarios/               A1–A8 与红队脚本
```

## 快速开始

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test
pnpm build

# 单次评估（无需 MCP 客户端）
pnpm guardian eval --policy policies/default.fail-closed.yaml \
  --server demo-fs --tool read_file --args '{"path":"/workspace/a.txt"}'

# A1–A8 一键（含红队 + Web 登录门禁）
bash scenarios/a1-a8.sh

# Web
pnpm dev:web   # http://127.0.0.1:3040

# Playwright smoke（落地页 / Demo / 登录门禁）
pnpm test:e2e
```

## Cursor 接入示例

先 `pnpm build`，再在 MCP 配置中指向 Gateway：

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

下游 `demo-fs` 由配置文件启动。默认 **fail-closed**：未匹配规则一律 deny；危险 shell 走 `require_approval`。

## 安全说明

- 本地审计库与 Web 数据目录可能含工具参数摘要；勿提交真实密钥。  
- `redact` 依赖策略路径配置，不能替代密钥轮换。  
- Demo Server 仅供红队演示，不要对生产数据使用。

## 文档

| 文档 | 说明 |
| --- | --- |
| [产品总方案](docs/product-plan.md) | 决策源 |
| [四周推进计划](docs/development-plan.md) | Week 0–5 |
| [架构说明](docs/architecture.md) | 包边界与错误码 |
| [Case Study](docs/case-study.md) | 作品集叙事 |
| [P1 Backlog](docs/p1-backlog.md) | 冻结后想法 |
| [GitHub 流程](docs/github-automation-playbook.md) | 分支 / PR / 合并 |

## License

MIT
