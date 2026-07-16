# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-16  
当前阶段：**Week 5 包装完成，待合入（PR #8）**  
仓库：<https://github.com/Ailian0206/mcp-guardian>  
PR 审核：Claude `/pr-review` + `scripts/pr-gate.sh`

## 1. 当前目标

Week 5 仅包装已交付；门禁通过后自动 merge。之后 **P0 冻结**，想法进 `docs/p1-backlog.md`。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| Week 0–4 | 已完成 | main |
| 英文 README | 已完成 | `README.en.md` |
| 演示录制 | 已完成 | `scripts/record-demo.sh` + `docs/assets/demo-walkthrough.webm` |
| EG 作品集条目 | 独立仓 | `evidence-graph` 分支 `chore/mcp-guardian-portfolio-entry` |
| Production URL | 可选 | Vercel |
| P0 | 已冻结 | 新想法 → P1 |

## 3. 验收

```bash
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a8.sh
pnpm test:e2e
bash scripts/record-demo.sh   # 可选，刷新 docs/assets/*
```

## 4. 合并

```bash
bash scripts/pr-gate.sh 8
```
