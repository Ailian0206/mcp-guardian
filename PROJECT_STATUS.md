# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-17  
当前阶段：**IDE 真实主路径打磨中（feat/ide-real-path-polish）**  
决策：[`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)

## 主路径

安装默认挂 demo-fs / demo-shell / demo-http → Cursor 用 `mcp-guardian` → 高危返回 `confirm_code` → 对话内 `guardian_decide`。

## 本里程碑验收

```bash
bash scenarios/ide-smoke.sh          # MCP Client 连 Gateway：allow/deny/redact/错码拒/对码放
bash scripts/install.sh --cursor     # 后重启 Cursor / Reload MCP
```

## PR 红线

里程碑才开 PR；Claude 每 PR 只审一次；修完 `SKIP_PR_REVIEW=1`，禁止复审/并发。
