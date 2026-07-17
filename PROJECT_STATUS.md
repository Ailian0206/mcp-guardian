# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-17  
当前阶段：**MVP 在 main；IDE 主路径小步已合入（无单独里程碑 PR）**  
决策：[`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)

## 主路径

`bash scripts/install.sh` → 默认 demo-fs/shell/http → 会话内 `guardian_decide`（需 confirm_code）。

## 自测（agent 负责，不甩给用户）

```bash
bash scenarios/ide-smoke.sh
bash scripts/verify-local.sh   # 完整时
```

## PR 红线

只有真正里程碑才开 PR；一开就必须 Claude 只审一次 → 修 → 合闭环。禁止开而不审。
