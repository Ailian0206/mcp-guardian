# MCP Guardian 架构说明

> 日期：2026-07-15  
> 状态：编码前冻结稿  
> 配套：[`product-plan.md`](./product-plan.md) · [`development-plan.md`](./development-plan.md)

## 1. 设计目标

1. **调用前拦截**：所有下游 `tools/call` 必须经过策略引擎。  
2. **可解释决策**：每次响应带 `matched_rule_id` 与 `reasons`。  
3. **本地优先**：无云也可完整执行 allow/deny/redact/approval。  
4. **敏感数据最小化**：默认出站与上云仅脱敏视图。  
5. **协议可替换**：传输层变化不影响策略引擎。

## 2. 包边界

| 包 | 职责 | 禁止事项 |
| --- | --- | --- |
| `packages/shared` | Zod 类型、错误码、常量 | 碰 IO、碰网络 |
| `packages/policy-engine` | YAML 解析、匹配、脱敏 | 碰 MCP 传输、碰数据库 |
| `packages/gateway` | MCP 代理、SQLite、CLI、审批桥、同步 outbox | 不实现 React UI |
| `packages/demo-servers` | 三个演示 MCP Server | 不进生产依赖 |
| `apps/web` | 落地页、Demo、Dashboard、Supabase API | 不直接连下游 MCP |

依赖方向：

```text
shared ← policy-engine ← gateway
shared ← demo-servers
shared ← apps/web
gateway 可调用 policy-engine；web 不依赖 gateway 运行时
```

## 3. Gateway 内部模块

```text
ConfigLoader
  → DownstreamRegistry（child process / remote URL）
  → McpProxy
       → PolicyEngine.evaluate(call)
       → Redactor.apply(args)
       → ApprovalService.maybeWait(decision)
       → AuditWriter.append(event)
       → Downstream.transport.callTool(...)
  → SyncWorker（可选，推送脱敏审计 / 拉策略）
```

### 3.1 调用时序（require_approval）

```text
Client tools/call
  → Proxy 生成 call_id
  → PolicyEngine => require_approval
  → Audit(pending_approval)
  → ApprovalService 等待（CLI 或 Web）
       ├─ approve → Downstream call → Audit(approved_then_allowed)
       ├─ deny    → 返回错误 → Audit(denied_by_user)
       └─ timeout → 返回错误 → Audit(approval_expired)
```

### 3.2 错误码（稳定对外）

| code | 含义 |
| --- | --- |
| `POLICY_DENIED` | 规则拒绝 |
| `POLICY_APPROVAL_REQUIRED` | 仍在等待（若协议允许中间态；否则对 Client 表现为超时类错误前的挂起） |
| `APPROVAL_DENIED` | 人审拒绝 |
| `APPROVAL_EXPIRED` | 超时 |
| `REDACT_BLOCKED` | 脱敏后参数非法，拒绝转发 |
| `DOWNSTREAM_ERROR` | 下游失败 |
| `CONFIG_INVALID` | 配置/策略校验失败 |
| `MODE_PERMISSIVE_WARNING` | 仅日志，不阻断 |

对 MCP Client 的 `isError` 响应 message 必须包含 `code=` 前缀，便于场景脚本断言。

## 4. 策略引擎算法

1. 校验 `version` 与 Zod schema。  
2. 若配置 `pre_redact`，先跑全局脱敏管线。  
3. 按 `rules[]` 顺序匹配：
   - `server` 精确或 glob  
   - `tool` 精确或 glob  
   - `args` 支持 `eq` / `matches` / `contains` / `exists`  
4. 命中后执行 action；未命中则：
   - `fail_closed` → deny  
   - `permissive` → allow 并记 warning  
5. 返回 `Decision`：`action`、`risk`、`matched_rule_id`、`reasons`、`redacted_args`。

匹配必须纯函数、无 IO，便于单测与快照测试。

## 5. 存储

### 5.1 本地 SQLite 路径

默认：`~/.mcp-guardian/state.db`  
可用环境变量 `MCP_GUARDIAN_HOME` 覆盖。

### 5.2 云表（逻辑）

见产品方案 §8.2。Web API 只接受已脱敏 payload；服务端再做一次 secret 正则扫描，命中则拒绝写入并告警。

## 6. 配置文件

`mcp-guardian.config.yaml`（Gateway）：

```yaml
mode: fail_closed
policyFile: ./policies/default.fail-closed.yaml
transport:
  listen: stdio # 或 http://127.0.0.1:3927
downstreams:
  - name: demo-fs
    command: node
    args: ["packages/demo-servers/dist/fs.js"]
approval:
  ttlSeconds: 300
  bridge: cli # cli | web | both
sync:
  enabled: false
  endpoint: https://mcp-guardian.vercel.app/api/sync
```

## 7. Web 路由

| 路由 | 访问 | 作用 |
| --- | --- | --- |
| `/` | 公开 | 产品落地 |
| `/demo` | 公开 | 只读回放 |
| `/demo/[id]` | 公开 | 单条审计 |
| `/app` | 登录 | 总览 |
| `/app/policies` | 登录 | 策略 |
| `/app/approvals` | 登录 | 审批 |
| `/app/audits` | 登录 | 审计 |
| `/api/sync/*` | device token | Gateway 同步 |
| `/api/approvals/*` | 登录 | 审批动作 |

## 8. 安全约束

1. Demo servers 默认 chroot 到临时 workspace 目录。  
2. `demo-shell` 必须 deny-by-default 命令白名单以外的可执行文件（演示用白名单 + 高危正则双重约束）。  
3. CI 用假密钥；禁止真实云密钥进入 scenario fixtures。  
4. Production Web 关闭 permissive 模式展示为「仅本地调试」。  
5. 所有上传审计先过 `SecretScanner`。

## 9. 测试金字塔

```text
单元：policy-engine、redactor、TTL           （大量）
集成：gateway + demo-fs in-process            （关键路径）
场景：scenarios/*.ts 断言 A1–A8               （产品验收）
E2E：Playwright 覆盖 /、/demo、登录门禁         （少量）
```

## 10. 观测

- Gateway：JSON line logs（`level`、`call_id`、`action`、`rule`）  
- Web：Sentry + Vercel Analytics  
- 不做完整分布式 tracing（避免做成 Langfuse 仿制品）

---

本文件在 Week 0 结束前冻结。实施中若协议细节变化，只改 `TransportAdapter` 与本文 §3/§6，不改策略引擎语义。
