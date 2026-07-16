# MCP Guardian

AI Agent 调用 MCP 工具前的权限、脱敏、审批与审计网关。

仓库：<https://github.com/Ailian0206/mcp-guardian>  
作品集：<https://github.com/Ailian0206/evidence-graph>（Work → MCP Guardian）  
English：[`README.en.md`](README.en.md)

## 它是什么（先分清主次）

| 组件 | 是否日常必需 | 作用 |
| --- | --- | --- |
| **本地 Gateway（MCP）** | **是** | 装进 Cursor / Codex，在 `tools/call` 前拦截 |
| CLI 审批 | 高危时需要 | `approvals list` / `decide`，本机完成 |
| Web Dashboard | **可选** | 演示、回放、远程审批；不是主路径 |

默认 **fail-closed**：未匹配规则一律 deny。

## 一键安装（推荐）

```bash
git clone https://github.com/Ailian0206/mcp-guardian.git
cd mcp-guardian
bash scripts/install.sh
```

脚本会：`pnpm install` → `pnpm build` → 写入：

- `~/.mcp-guardian/mcp-guardian.config.yaml`（绝对路径配置）
- Cursor：`~/.cursor/mcp.json` 增加 `mcp-guardian`（原文件备份为 `.bak-mcp-guardian`）
- Codex：`~/.codex/config.toml` 增加 `[mcp_servers.mcp-guardian]`

只装一边：

```bash
bash scripts/install.sh --cursor
bash scripts/install.sh --codex
```

已构建过时可直接：

```bash
pnpm guardian install          # Cursor + Codex
pnpm guardian install --cursor
pnpm guardian install --codex
```

然后 **重启 Cursor / Codex**（或 Reload MCP），列表中应出现 `mcp-guardian`。

### 装好后怎么用

1. 让 Agent 调用该 MCP 下的工具（当前演示下游为 `demo-fs`）。  
2. 允许路径 / 拒绝写系统目录等由策略自动处理，多数情况**不用开网页**。  
3. 若出现待审批：

```bash
pnpm guardian approvals list
pnpm guardian approvals decide <id> --allow   # 或 --deny
```

4. Web 仅演示：`pnpm dev:web` → http://127.0.0.1:3040  

## 开发与验收

```bash
pnpm install && pnpm build
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a8.sh
pnpm test:e2e
```

## 安全说明

- 演示下游 `demo-fs` 不是你的真实磁盘工具；接生产 MCP 请改 `~/.mcp-guardian/mcp-guardian.config.yaml` 的 `downstreams`。  
- 审计可能含参数摘要；勿提交真实密钥。  
- `redact` 不能替代密钥轮换。

## 文档

| 文档 | 说明 |
| --- | --- |
| [产品总方案](docs/product-plan.md) | 决策源 |
| [Case Study](docs/case-study.md) | 叙事 |
| [P1 Backlog](docs/p1-backlog.md) | 冻结后想法 |
| [GitHub 流程](docs/github-automation-playbook.md) | PR / 审核 |

## License

MIT
