# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-15  
当前阶段：**Week 3 Dashboard 开发中（feat/week3-dashboard，验收前不开 PR）**  
仓库：<https://github.com/Ailian0206/mcp-guardian>  
决策源：`docs/product-plan.md`  
Bugbot：API 额度用尽且 On-demand Disabled → 审 PR 暂停；继续少开 PR

## 1. 当前目标

Week 3：Next.js 落地页 / Demo / Dashboard；本地登录；policies/approvals/audits；Gateway 可选 sync。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| Week 0–2 | 已完成 | 已合入 main |
| PR 预算规则 | 已并入本分支 | 同时最多 1 个开放 PR |
| Web Next.js | 进行中 | `/` `/demo` `/app/*` |
| 本地 Auth | 进行中 | cookie 会话，未登录进不了 `/app` |
| Sync API | 进行中 | device + events |
| Supabase | 延后 | Week3 用本地存储，不强制云账号 |

## 3. 开 PR 条件

整周验收通过且当前无其它开放 PR 后，才开 **一个** Draft PR。

```bash
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a5.sh
bash scenarios/week3-web-auth.sh
```
