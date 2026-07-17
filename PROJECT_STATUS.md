# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-17  
当前阶段：**MVP 里程碑已合入 main（PR #9 已合并）**  
决策：[`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)

## 主路径（已落地）

`bash scripts/install.sh` → Cursor/Codex 用 `mcp-guardian` → 高危在对话里带 `confirm_code` 调 `guardian_decide`。  
Web = 介绍 / FAQ / 策略试跑（非审批台）。

## 完成度（相对再定位成功标准）

| 标准 | 状态 |
| --- | --- |
| 一键安装 Cursor/Codex | 已完成 |
| allow / deny / redact 自动拦 | 已完成（A1–A8） |
| 会话内审批 + confirm_code | 已完成 |
| Web 介绍/FAQ/试跑 | 已完成 |
| 作品集 EG 叙事 | EG 侧另有 PR #12（非本仓） |

**结论：** 按再定位后的 MVP 范围，**开发主交付已完毕**；后续是真实 IDE 使用打磨与作品集包装，不是再开一堆功能 PR。

## 验证

```bash
bash scripts/verify-local.sh   # 或 lint/typecheck/test + scenarios/a1-a8.sh
bash scripts/install.sh        # 后重启 Cursor，试一次高危工具会话内批准
```

## PR 流程（锁定）

Claude **只审一次** → 有评论则修 → **不复审** → 本地+CI 绿直接合。  
**不要频繁开 PR**；只在有里程碑意义时开（同时 ≤1）。
