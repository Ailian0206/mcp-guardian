# MCP Guardian

装进 **Cursor / Codex** 的本地 MCP 策略中间层：在 Agent 调用工具前 allow / deny / redact；高危在 **同一次 Agent 对话** 里批准。

仓库：<https://github.com/Ailian0206/mcp-guardian>  
在线说明书：<https://ailian0206.github.io/mcp-guardian/>（GitHub Pages 静态站：介绍 / FAQ / Demo；**不含** Dashboard API）  
作品集：Evidence Graph → Work → MCP Guardian  
决策文档：[`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)

## 主路径（请按这个理解）

1. `bash scripts/install.sh` → 重启 IDE  
2. Agent 正常用工具；多数策略自动生效  
3. 高危 → 返回 `approval_required` → Agent 问你 → 你确认 → Agent 调 `guardian_decide`  
4. **不需要**打开网页审批，也**不需要**另开终端跑 approvals  

Web 站点只做介绍 / FAQ / 可选策略试跑。

## 一键安装

```bash
git clone https://github.com/Ailian0206/mcp-guardian.git
cd mcp-guardian
bash scripts/install.sh
```

写入 Cursor `~/.cursor/mcp.json`、Codex `~/.codex/config.toml` 与 `~/.mcp-guardian/`。  
仅一边：`bash scripts/install.sh --cursor` 或 `--codex`。

### 真实下游（官方 Filesystem MCP）

默认安装是演示下游。接真实磁盘目录：

```bash
pnpm build
node packages/gateway/dist/cli.js install --cursor --profile filesystem --workspace /ABS/PATH/TO/DIR
# Reload MCP 后：读放行；写/改/移 → 会话内 confirm_code + guardian_decide
```

切回演示：`--profile demos`。示例配置：[`examples/real-filesystem.config.yaml`](examples/real-filesystem.config.yaml)。

## Agent 会话内审批

当策略为 `require_approval` 时，工具结果包含：

- `approval_id`
- `agent_instructions`：先问用户，再调用 `guardian_decide`

同 MCP 还暴露：

- `guardian_pending` — 查看待批  
- `guardian_decide` — `{ id, decision: "allow" | "deny", confirm_code? }`；allow 须带码

## Web（说明书 / 作品集门面）

在线：<https://ailian0206.github.io/mcp-guardian/>

```bash
pnpm dev:web   # http://127.0.0.1:3040  → /  /faq  /demo
pnpm build:pages  # 静态导出 → apps/web/out（供 GitHub Pages）
```

- `/`：价值、安装步骤、日常流程、真实下游、与 Trace 差异、FAQ 摘要、演示录屏  
- `/faq`：入门 / 日常 / 真实下游 / 排错  
- `/demo`：浏览器内现场试跑策略 + 只读审计回放（**不是**审批台）  
- `/app`：可选 Dashboard（仅本地 / 非 Pages；需服务端 API）

## 开发验收

```bash
pnpm install && pnpm build
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a8.sh
bash scenarios/ide-smoke.sh
bash scenarios/real-filesystem.sh
```

## License

MIT
