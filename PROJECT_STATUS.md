# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-22  
当前阶段：**本仓主交付完成 → 维护待命**  
决策：[`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)  
在线说明书：<https://ailian0206.github.io/mcp-guardian/>

## 完成度（相对 redesign 成功标准）

| # | 标准 | 状态 |
| --- | --- | --- |
| 1 | 一键安装进 Cursor/Codex | 已完成 |
| 2 | allow / deny / redact 自动拦 | 已完成 |
| 3 | 会话内 `confirm_code` + `guardian_decide` | 已完成 |
| 4 | Web = 介绍 / 安装 / FAQ / 试跑（非审批台） | 已完成（PR #12） |
| 5 | Evidence Graph Work 页讲清主路径 | **未做**（需点名才动 EG，非本仓） |
| 6 | GitHub Pages 公开说明书 | 进行中 |

## 已合里程碑

| 里程碑 | 内容 | PR |
| --- | --- | --- |
| MVP 主路径 | 安装、策略、会话内审批 | #9 |
| 里程碑 A | 官方 Filesystem 真实下游 | #11 |
| 里程碑 B（本仓） | Web 说明书门面 + 文档对齐 | #12 |
| Pages | Web 静态导出 + GitHub Pages | — |

## 默认下一步

**维护待命**：有真实踩坑再修；不没事开 PR、不加 Dashboard/云同步。  
P1 想法见 [`docs/p1-backlog.md`](docs/p1-backlog.md)。  
作品集 EG 条目：只有你明确说「做作品集 / 动 EG」才开刀。

## 验证

```bash
bash scenarios/a1-a8.sh
bash scenarios/ide-smoke.sh
bash scenarios/real-filesystem.sh
pnpm dev:web   # http://127.0.0.1:3040 → /  /faq  /demo
pnpm build:pages  # → apps/web/out
```
