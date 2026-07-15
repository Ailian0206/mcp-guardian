# P1 Backlog（P0 已冻结）

> 日期：2026-07-15  
> 规则：MVP（A1–A8）之后的想法一律进本文件，**不得**再塞进当前周 scope。

## 产品

- [ ] Supabase GitHub OAuth 替换本地 cookie（多设备）
- [ ] 策略可视化编辑器（YAML 仍为真源）
- [ ] 审批 TTL 到期自动 deny + 通知
- [ ] 多租户 / 团队策略包
- [ ] 公开 Production Demo URL + 只读 seed 刷新流水线

## 工程

- [ ] Gateway 热重载策略
- [ ] 审计导出（JSONL / CSV）
- [ ] OpenTelemetry span 导出（可选，仍不做 Trace 平台）
- [ ] Windows / WSL 场景脚本 CI 矩阵
- [ ] Sentry 生产错误上报（DSN 由部署环境注入）

## 明确不做（近期）

- 通用 LLM Prompt 防火墙  
- 替代 Langfuse 的完整 Trace UI  
- 无策略时的 fail-open「先跑起来再说」
