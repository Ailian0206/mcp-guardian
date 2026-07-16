# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-16  
当前阶段：**Week 5 包装（chore/week5-packaging）**  
仓库：<https://github.com/Ailian0206/mcp-guardian>  
PR 审核：Claude `/pr-review` + `scripts/pr-gate.sh`

## 1. 当前目标

Week 5 仅包装：**不加功能**。英文 README、演示录制脚本、Evidence Graph 作品集条目。

## 2. 状态板

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| Week 0–4 | 已完成 | main |
| 英文 README | 进行中 | `README.en.md` |
| 演示录制 | 进行中 | `scripts/record-demo.sh` + walkthrough e2e |
| EG 作品集条目 | 待做 | `evidence-graph` Work 页 |
| Production URL | 可选 | Vercel |

## 3. 验收

```bash
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a8.sh
pnpm test:e2e
bash scripts/record-demo.sh   # 可选，生成 docs/assets/*
```

## 4. 下一步

整周验收 → 开唯一 PR → `bash scripts/pr-gate.sh <n>`
