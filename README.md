# MCP Guardian

装进 **Cursor / Codex** 的本地 MCP 策略中间层：在 Agent 调用工具前 allow / deny / redact；高危在 **同一次 Agent 对话** 里批准。

仓库：<https://github.com/Ailian0206/mcp-guardian>  
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

## Agent 会话内审批

当策略为 `require_approval` 时，工具结果包含：

- `approval_id`
- `agent_instructions`：先问用户，再调用 `guardian_decide`

同 MCP 还暴露：

- `guardian_pending` — 查看待批  
- `guardian_decide` — `{ id, decision: "allow" | "deny" }`；allow 时才真正执行原工具  

## Web（说明书）

```bash
pnpm dev:web   # http://127.0.0.1:3040  → /  /faq  /demo
```

## 开发验收

```bash
pnpm install && pnpm build
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a8.sh
```

## License

MIT
