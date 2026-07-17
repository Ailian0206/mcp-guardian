# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-17  
当前阶段：**MVP 主交付已在 main**；PR 流程已按「成本红线」加固  
决策：[`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)

## 主路径

`bash scripts/install.sh` → IDE 用 `mcp-guardian` → 高危会话内 `guardian_decide`（需 `confirm_code`）。  
Web = 介绍 / FAQ / 试跑。

## PR / 额度红线（强制）

- **禁止没事开 PR**；开前：`bash scripts/assert-can-open-pr.sh`  
- Claude **每个 PR 只审一次**；`pr-gate.sh` flock 防并发；已审过拒绝对第二次  
- 修完：`SKIP_PR_REVIEW=1`，**禁止复审**  
- 不用 Bugbot；不碰其他仓库

## 验证

```bash
bash scripts/verify-local.sh
```
