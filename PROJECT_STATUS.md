# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-16  
当前阶段：**Week 4 MVP 已合入 main（PR #7）**  
仓库：<https://github.com/Ailian0206/mcp-guardian>  
决策源：`docs/product-plan.md`  
PR 审核：**Claude `/pr-review`**（替代 Bugbot）；合并门禁见 `scripts/pr-gate.sh`

## 1. 当前目标

Week 5 仅包装（GIF / 作品集条目 / Production URL 可选），**不加功能**。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| Week 0–4 | 已完成 | PR #7 已 merge |
| Claude PR 审核 | 已启用 | `.claude/skills/pr-review` + `scripts/pr-gate.sh` |
| 红队 / A1–A8 | 已完成 | `scenarios/a1-a8.sh` |
| Playwright smoke | 已完成 | `pnpm test:e2e` |
| Production URL | 可选 | Vercel 部署由维护者决定 |

## 3. 验收命令

```bash
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a8.sh
pnpm test:e2e
```

## 4. 开 PR 后全自动闭环

```bash
# 触发 Claude 审核 → 等待 marker → 本地门禁 → merge
bash scripts/pr-gate.sh <PR编号>
```

触及审核协议路径时脚本自动走 `--trusted-base` detached worktree。

## 5. 下一步

1. Week 5 包装（演示 GIF、Evidence Graph 作品集条目）  
2. （可选）Vercel Production 部署
