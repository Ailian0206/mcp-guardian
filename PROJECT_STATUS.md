# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-16  
当前阶段：**一键安装 + 作品集展示（feat/one-click-install）**  
仓库：<https://github.com/Ailian0206/mcp-guardian>  
作品集：Evidence Graph → Work → MCP Guardian

## 1. 主路径

1. `bash scripts/install.sh` → 写入 Cursor / Codex MCP  
2. 重启客户端，使用 `mcp-guardian`  
3. 高危审批：`pnpm guardian approvals decide <id> --allow`  
4. Web 可选（演示 / 回放）

## 2. 状态板

| 模块 | 状态 |
| --- | --- |
| Week 0–5 MVP | 已合入 main |
| `mcp-guardian install` | 本分支 |
| `scripts/install.sh` | 本分支 |
| Evidence Graph 作品集条目 | 已有；文案强化「一键安装」 |

## 3. 验收

```bash
bash scripts/install.sh --cursor   # 或 --all
# 重启 Cursor 后 MCP 列表含 mcp-guardian
pnpm lint && pnpm typecheck && pnpm test
```
