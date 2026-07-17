# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-16  
当前阶段：**产品再定位落地中（feat/one-click-install / PR #9）**  
决策：[`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)

## 主路径

安装 → IDE Agent 用工具 → 高危在对话里 `guardian_decide`。Web = 介绍/FAQ。

## 验收

```bash
bash scripts/install.sh
pnpm lint && pnpm typecheck && pnpm test
bash scenarios/a1-a8.sh
# 重启 Cursor 后：触发高危工具 → 对话批准 → guardian_decide
```
