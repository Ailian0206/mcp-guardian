# Case Study：MCP Guardian（初稿）

> 日期：2026-07-15  
> 状态：MVP 本地可演示；Week 5 演示素材见 `docs/assets/`

## 问题

AI Agent 接上 MCP 后，工具调用往往 **先执行再观测**。Trace 平台（Langfuse / LangSmith）擅长事后复盘，但拦不住一次危险的 `rm -rf`、越权读 `/etc`、或把 API Key 打进 HTTP 参数。

## 方案

MCP Guardian 是 **调用前** 的策略网关：

| 决策 | 含义 |
| --- | --- |
| allow | 放行 |
| deny | 硬拒绝 |
| redact | 改写敏感参数后再放行 |
| require_approval | 挂起，等人批 |

默认 **fail-closed**：无规则命中一律 deny。本地 SQLite + 可选 Web Dashboard 同步审批与审计回放。

## 与 Trace 的边界

- Trace：调用后看发生了什么  
- Guardian：调用前决定能不能发生  

两者互补，不互替。

## 本地可复现证据

```bash
pnpm install && pnpm build
bash scenarios/a1-a8.sh
pnpm test:e2e   # 落地页 / Demo / 登录门禁
pnpm dev:web    # http://127.0.0.1:3040
```

红队六场景（越权读、危险写、密钥外泄、高危 shell、可疑 URL、批量轰炸）见 `scenarios/redteam-six.sh`。

## 作品集定位

个人作品集第三条产品线：

1. **AI Photo Studio CN** — 多模态 SaaS  
2. **Evidence Graph** — 可追溯研究  
3. **MCP Guardian** — Agent 工具调用前治理  

## 已知边界（诚实披露）

- Week 3/4 Dashboard 默认本地 cookie 会话，未强制 Supabase OAuth  
- PR 审核由 Claude `/pr-review` 替代 Bugbot（见 `scripts/pr-gate.sh`）  
- Production 部署（Vercel）需维护者账号操作；本地验收不依赖云
