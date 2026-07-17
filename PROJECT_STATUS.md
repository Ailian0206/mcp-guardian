# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-17  
当前阶段：**里程碑 B — 本仓 Web 说明书 / 作品集门面（进行中）**  
决策：[`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)

## 已完成

| 里程碑 | 内容 | 状态 |
| --- | --- | --- |
| MVP 主路径 | 安装、策略、会话内 `confirm_code` + `guardian_decide` | 已合 main（PR #9） |
| IDE 打磨 | 三下游默认安装 + `ide-smoke` | 已合 main（非里程碑小步） |
| 里程碑 A | 官方 Filesystem 真实下游 + fail-closed 策略 | 已合 main（PR #11） |

## 本里程碑（B · 仅本仓）

- 重做 `/`：价值、安装步骤、日常流程、真实下游、与 Trace 差异、FAQ 摘要、演示录屏
- 重做 `/faq`：按入门 / 日常 / 真实下游 / 排错分组
- 清理 `/demo`：去掉 Dashboard 主路径叙事；保留策略试跑与只读回放
- 文档对齐真实进度：`PROJECT_STATUS`、`case-study`、`README.en`、推进计划历史标注

**不做：** 改 `evidence-graph`、云同步、把 Web 审批台重新做成主路径。

## 验证

```bash
pnpm --filter @mcp-guardian/web build
pnpm --filter @mcp-guardian/web test:e2e
pnpm dev:web   # http://127.0.0.1:3040 → /  /faq  /demo
```

## PR 红线

真里程碑才开 PR；开则 Claude 只审一次 → 修 → 合闭环。
