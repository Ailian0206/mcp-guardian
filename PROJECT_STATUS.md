# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-15  
当前阶段：**Week 4 MVP 本地验收（feat/week4-mvp-polish）**  
仓库：<https://github.com/Ailian0206/mcp-guardian>  
决策源：`docs/product-plan.md`  
Bugbot：API 额度用尽且 On-demand Disabled → PR 审阅可能 skip；合并以 CI + 人工为准

## 1. 当前目标

完成 Week 4：红队六场景、A1–A8、统计、落地页、Playwright smoke、Case Study；开 **唯一** Draft PR 进入人工审核。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| Week 0–3 | 已完成 | 已合入 main |
| 红队六场景 | 已完成 | `scenarios/redteam-six.sh` |
| A1–A8 | 已完成 | `scenarios/a1-a8.sh` |
| Dashboard 统计 | 已完成 | allow/deny/redact/require_approval |
| 落地页 / Demo seed | 已完成 | `/` `/demo` |
| Playwright smoke | 已完成 | `pnpm test:e2e` |
| Case Study / P1 | 已完成 | `docs/case-study.md` `docs/p1-backlog.md` |
| Production URL | **阻塞** | 需维护者部署 Vercel；本地不阻塞验收 |

## 3. 验收命令

```bash
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a8.sh
pnpm test:e2e
```

## 4. 下一步（人工审核）

1. Review Draft PR（Week 4）  
2. 部署 Production（可选，补 Case Study URL）  
3. Week 5 仅包装（GIF / 作品集条目），**不加功能**
