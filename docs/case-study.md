# Case Study：MCP Guardian

> 日期：2026-07-22  
> 状态：MVP + 真实下游（Filesystem）已合入；Web 为说明书 / 作品集门面  
> 在线：<https://ailian0206.github.io/mcp-guardian/>  
> 决策：[`product-redesign-2026-07-16.md`](./product-redesign-2026-07-16.md)  
> 演示：[`assets/demo-walkthrough.webm`](./assets/demo-walkthrough.webm)

## 问题

AI Agent 接上 MCP 后，工具调用往往 **先执行再观测**。Trace 平台（Langfuse / LangSmith）擅长事后复盘，但拦不住一次危险的 `rm -rf`、越权写系统路径、或把 API Key 打进 HTTP 参数。

## 方案

MCP Guardian 是装进 **Cursor / Codex** 的本地 **调用前** 策略网关：

| 决策 | 含义 |
| --- | --- |
| allow | 放行 |
| deny | 硬拒绝 |
| redact | 改写敏感参数后再放行 |
| require_approval | 挂起；在 **同一次 Agent 对话** 里带 `confirm_code` 调 `guardian_decide` |

默认 **fail-closed**：无规则命中一律 deny。审计写入本机 SQLite。

**不做主路径：** 网页审批台、另开终端跑 `approvals decide`（CLI 仅调试保留）。

## 与 Trace 的边界

- Trace：调用后看发生了什么  
- Guardian：调用前决定能不能发生  

两者互补，不互替。

## 本地可复现证据

```bash
git clone https://github.com/Ailian0206/mcp-guardian.git
cd mcp-guardian
bash scripts/install.sh          # 一键写入 Cursor / Codex MCP
bash scenarios/a1-a8.sh          # 四种动作 + 验收
bash scenarios/ide-smoke.sh      # 会话内 confirm_code 闭环
bash scenarios/real-filesystem.sh # 官方 Filesystem 下游
pnpm test:e2e                    # 可选 Web smoke
```

真实下游安装：

```bash
pnpm build
node packages/gateway/dist/cli.js install --cursor \
  --profile filesystem --workspace /ABS/PATH/TO/DIR
```

红队六场景：`scenarios/redteam-six.sh`。

## 作品集定位

个人作品集第三条产品线：

1. **AI Photo Studio CN** — 多模态 SaaS  
2. **Evidence Graph** — 可追溯研究  
3. **MCP Guardian** — Agent 工具调用前治理  

本仓 Web（在线 <https://ailian0206.github.io/mcp-guardian/>；本地 `pnpm dev:web` → `:3040`）讲清价值、安装、FAQ、策略试跑；Evidence Graph Work 页条目另仓维护。

## 已知边界（诚实披露）

- 会话内 `guardian_decide` 不是与 Agent 密码学隔离的独立信道；依赖外层工具确认 UI + `confirm_code`  
- `/app/*` Dashboard 代码保留，但不是日常主路径  
- Production 部署（Vercel）需维护者账号；本地验收不依赖云  
- PR 审核由 Claude `/pr-review` 替代 Bugbot（见 `scripts/pr-gate.sh`）
