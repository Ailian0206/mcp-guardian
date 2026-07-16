# MCP Guardian 产品总方案

> 日期：2026-07-15  
> 状态：**部分章节已被 [`product-redesign-2026-07-16.md`](./product-redesign-2026-07-16.md) 取代**（主路径改为本地 Gateway + Agent 会话内审批；Web 仅介绍/FAQ）。  
> 决策权：产品推进由 Agent 定稿；用户验收最终结果。  
> 定位：个人作品集第三主项目；与 `ai-photo-studio-cn`、`evidence-graph` 形成能力三角。

## 1. 最终决策（已锁定）

1. **产品名**：MCP Guardian  
2. **仓库名**：`mcp-guardian`（独立仓库，不混入 `evidence-graph` / `ai-photo-studio-cn`）  
3. **一句话定义**：AI Agent 调用 MCP 工具前的**权限、脱敏、审批与审计网关**。  
4. **核心叙事**：不是又一个 Agent Trace 平台，也不是通用聊天安全产品；只做 **MCP `tools/call` 调用链上的策略执行层**。  
5. **双运行时架构**：
   - `packages/gateway`：本地长期运行的 MCP 代理（stdio / Streamable HTTP）
   - `apps/web`：策略、审批、审计、红队 Demo 与作品集落地页（Next.js）
6. **MVP 优先本地可用**：Gateway 在无云账号时也能用本地 YAML 策略跑通；云端 Dashboard 用于同步策略、持久化审计与公开演示。  
7. **启动时机**：Evidence Graph 达到「可公开演示的研究闭环」后启动正式编码；本方案与仓库文档可先行落地。  
8. **正式开发周期**：启动后 **4 周**交付可演示 MVP；第 5 周只做作品集包装与公开案例，不做功能膨胀。  
9. **MVP 不接支付、不做多租户组织、不做浏览器扩展、不自托管大模型、不做通用 Prompt Firewall。**  
10. **成功标准不是“页面很多”**，而是：访客能在 5 分钟内看懂产品、跑通一次危险工具拦截、查看审计回放，并理解它与 Langfuse/LangSmith 的差异。

## 2. 为什么做这个，而不是别的

### 2.1 作品集缺口

| 现有项目 | 已覆盖 | 仍缺 |
| --- | --- | --- |
| AI Photo Studio CN | 多模态生成、C 端 SaaS、credits、provider | Agent 安全 / 工具治理 |
| Evidence Graph | 调研 Agent、Claim/Evidence、RAG、图谱 | 调用前策略与权限控制 |

MCP Guardian 补上第三角：**基础设施 + 安全策略 + 可审计执行**。

### 2.2 市场与 Starter Story 依据

- Starter Story 中 Automation、Micro SaaS、`$1M Shovels` 类项目证明「给开发者/创业者的铲子」可持续。  
- 2026 年 Agent 广泛接入 MCP；安全评估披露仍不足，「可控、可审批、可审计」是明确缺口。  
- LangSmith / Langfuse / Phoenix 主打 **观测与评测**；Guardian 主打 **调用前拦截与策略**，产品边界清晰，避免正面撞车。

### 2.3 未采用的方向（明确否决）

| 方向 | 否决原因 |
| --- | --- |
| 通用 AgentOps / Trace 平台 | 竞品成熟，差异弱，名字冲突 |
| 纯 GPT Wrapper 安全聊天 | 壁垒低，不符合作品集技术深度目标 |
| 浏览器 Workflow QA | 演示强但竞品多，且与 Photo Studio 的 Playwright 能力部分重叠 |
| 财务对账 Agent | 需大量模拟业务数据，冷启动成本高 |
| 把 Guardian 塞进 Evidence Graph | 会污染研究产品边界，也不利于独立展示 |

## 3. 产品定位

### 3.1 目标用户（MVP 只服务一类）

正在给 Cursor / Claude / 自建 Agent 接入 MCP 工具的**独立开发者与小团队工程师**，他们害怕：

- Agent 误删文件、误发请求、泄露 API Key  
- 无法证明“哪些工具被允许过”  
- 高风险操作缺少人工闸门  

### 3.2 非目标用户（MVP）

- 需要 SOC2 合规采购的大型企业安全团队（可作为后续叙事，不做本期交付）  
- 只要聊天内容过滤、不要工具调用治理的用户  
- 需要完整 SIEM / SOAR 集成的安全运营团队  

### 3.3 核心工作流

```text
MCP Client（Cursor / 自建 Agent）
  → MCP Guardian Gateway（策略评估）
      → allow：转发至 MCP Server
      → redact：改写参数后转发
      → deny：拒绝并写审计
      → require_approval：进入审批队列，通过后再转发
  → 审计日志 + 风险分 + 回放
  → Dashboard 查看 / 导出
```

### 3.4 与竞品的本质区别

| 能力 | Langfuse / LangSmith | MCP Guardian |
| --- | --- | --- |
| 主问题 | Agent 跑得怎样、为何失败 | Agent **能不能调用**、调用是否越权 |
| 作用时机 | 调用后观测 / 评测 | **调用前**拦截 |
| 核心对象 | Trace、Span、Dataset | Tool Call、Policy、Approval、Audit |
| 协议焦点 | 多框架通用 | **MCP 优先** |
| MVP 证明点 | 质量分、延迟、成本 | 拦截率、脱敏、人工批准、回放 |

## 4. MVP 产品范围

### 4.1 必须完成（P0）

1. 可安装的本地 Gateway CLI：`npx mcp-guardian` / `mcp-guardian start`  
2. 支持至少两种传输：stdio 桥接、Streamable HTTP（或 SSE，以实现时 MCP SDK 稳定能力为准）  
3. 代理任意下游 MCP Server（配置文件声明 command/url）  
4. 策略引擎（同步、确定性优先）：
   - 按 `server` / `tool` / `argument path` 匹配  
   - 动作：`allow` / `deny` / `redact` / `require_approval`  
5. 内置脱敏规则：API Key、Bearer Token、邮箱、手机号、私钥片段  
6. 审批队列：CLI 交互批准 + Web Dashboard 批准（同一 Audit ID）  
7. 审计日志：每次 `tools/call` 记录请求摘要、决策、耗时、风险分、结果状态  
8. 调用回放页：展示原始参数（脱敏后）、匹配策略、最终动作  
9. Web Dashboard：策略列表、审计列表、审批待办、基础统计  
10. Demo 套件：
    - 3 个示例 MCP Server：`demo-fs`、`demo-shell`、`demo-http`  
    - 6 个红队场景脚本（越权读、危险写、密钥外泄、高危 shell、SSRF 倾向 URL、批量工具轰炸）  
11. 公开落地页 + 无需登录的只读 Demo 案例（预置审计回放）  
12. GitHub 登录（Dashboard 私有数据）；公开 Demo 不需登录  

### 4.2 明确不做（P0 禁区）

- 订阅支付、Seat、组织/团队 RBAC  
- 任意 LLM Prompt 全流量防火墙（非 MCP 工具调用）  
- 自动“智能判定一切风险”的黑盒模型主决策（模型只能辅助打分，不能替代确定性策略）  
- Kubernetes Operator / 企业 IdP / SCIM  
- 浏览器扩展、IDE 插件市场发布（可在文档中写 Cursor 配置示例即可）  
- 自研 MCP Server 市场  
- 完整 eBPF / 系统调用级沙箱  
- 多区域合规存证链  

### 4.3 P1（MVP 验证后再做，不进四周范围）

- 策略版本 Diff 与一键回滚  
- 组织级共享策略包  
- OTel 导出  
- Slack / 飞书审批通知  
- 策略市场（社区 YAML）  
- 与 Evidence Graph 的“研究 Agent 默认经 Guardian 出站”集成演示  

## 5. 用户故事与验收场景

### 5.1 主角故事

> 作为一名给 Agent 接入了文件系统与 HTTP MCP 的开发者，我希望危险写操作必须人工批准，且任何外发请求中的密钥被自动脱敏，以便我能安心让 Agent 工作，并在事后证明发生了什么。

### 5.2 验收场景（必须全部通过）

| ID | 场景 | 期望 |
| --- | --- | --- |
| A1 | 调用 `demo-fs.read` 读取允许目录 | `allow`，审计可查 |
| A2 | 调用 `demo-fs.write` 写系统敏感路径 | `deny`，返回明确错误码 |
| A3 | 调用 `demo-http.fetch` 且 URL 含 API Key query | 参数 `redact` 后转发或拒绝（按策略），审计可见脱敏前后摘要 |
| A4 | 调用 `demo-shell.run` 含 `rm -rf` | `require_approval`；未批准前不执行 |
| A5 | 在 Dashboard 批准 A4 | 工具真正执行；审计状态变为 `approved_then_allowed` |
| A6 | 红队脚本批量触发 | 统计页显示 deny/redact/approval 计数 |
| A7 | 断网纯本地模式 | 仅用本地 YAML + 本地 SQLite/JSONL 审计仍可完成 A1–A5（Web 批准可降级为 CLI 批准） |
| A8 | 公开 Demo 页 | 未登录可查看预置回放，不能改策略 |

## 6. 技术决策

### 6.1 技术栈（锁定）

| 模块 | 选择 | 原因 |
| --- | --- | --- |
| Monorepo | pnpm workspace + Turborepo | gateway / web / shared 清晰拆分 |
| 语言 | TypeScript（全程） | 与现有两项目一致，MCP 官方 TS SDK 成熟 |
| MCP | `@modelcontextprotocol/sdk` | 官方协议实现，减少自研 JSON-RPC 风险 |
| Gateway 运行时 | Node.js 22+ | 本地 CLI 与长期进程合适 |
| 策略 DSL | YAML + Zod 校验 | 人类可读、可进 Git、易演示 |
| 本地审计存储 | SQLite（`better-sqlite3` 或 `libsql`） | 零运维，支持回放查询 |
| Web | Next.js 15/16 + Tailwind + shadcn/ui | 与 Evidence Graph 同栈，作品集一致 |
| 云数据库 | Supabase Postgres | 策略同步、云审计、Auth |
| Auth | Supabase Auth + GitHub OAuth | 开发者受众匹配 |
| 部署 | Vercel（仅 Web）+ Gateway 以 npm 包分发 | Gateway 不适合 Serverless 长连接 |
| 测试 | Vitest + Playwright | 单测策略引擎；E2E 跑通 Demo 场景 |
| 监控 | Sentry（Web）+ Gateway 结构化日志 | 够用，不引入重型 APM |

### 6.2 架构总览

```text
┌──────────────────────────────────────────────────────────┐
│ apps/web (Vercel)                                        │
│  /                 产品落地页 + 差异说明                   │
│  /demo             公开只读回放                           │
│  /app/policies     策略编辑                              │
│  /app/approvals    审批队列                              │
│  /app/audits       审计与回放                            │
│  /api/*            策略同步 / 审批回调                    │
└──────────────▲───────────────────────────────────────────┘
               │ HTTPS（可选同步）
┌──────────────┴───────────────────────────────────────────┐
│ packages/gateway (本地进程)                               │
│  MCP Client ←→ Policy Engine ←→ Downstream MCP Server(s) │
│  Local SQLite audit  │  Approval bridge (CLI/Web)         │
└──────────────────────────────────────────────────────────┘
               │
     ┌─────────┼─────────┐
     ▼         ▼         ▼
  demo-fs   demo-shell  demo-http
```

### 6.3 关键设计约束

1. **策略评估必须同步且可解释**：每次决策输出 `matched_rule_id`、`action`、`reasons[]`。  
2. **默认安全**：无匹配规则时，MVP 默认 `deny`（fail-closed）；提供 `mode: permissive` 仅用于本地调试，且 Dashboard 显著警告。  
3. **密钥不入云明文**：同步到云的审计默认只存脱敏后 payload；原始敏感值仅存本地可选加密槽，默认关闭。  
4. **Gateway 是真相源执行点**：Web 不能绕过 Gateway 直接打下游 MCP。  
5. **审批有超时**：默认 5 分钟未批则 `deny`，避免 Agent 挂死。  

### 6.4 未采用方案

| 方案 | 未采用原因 |
| --- | --- |
| 纯 Vercel Serverless 做 Gateway | MCP 长连接与本地 stdio 不适合 |
| 把策略引擎做成必须在线的云服务 | 违背本地优先与断网可用 |
| Rust 重写 Gateway | 作品集阶段交付速度优先；TS 足够且与 MCP SDK 对齐 |
| 以 LLM 作为主策略引擎 | 不可解释、不稳定、成本高；只允许辅助风险分 |

## 7. 策略模型

### 7.1 策略文件示例

```yaml
version: 1
mode: fail_closed # fail_closed | permissive
defaults:
  approval_ttl_seconds: 300
  risk_threshold_for_approval: 70

rules:
  - id: allow-safe-reads
    when:
      server: demo-fs
      tool: read_file
      args:
        path: { matches: "^/workspace/" }
    action: allow
    risk: 10

  - id: deny-etc-write
    when:
      server: demo-fs
      tool: write_file
      args:
        path: { matches: "^/(etc|var|usr)/" }
    action: deny
    risk: 95
    reason: "拒绝写入系统目录"

  - id: redact-secrets-in-http
    when:
      server: demo-http
      tool: fetch
    action: redact
    redact:
      - path: headers.authorization
        replace: "***REDACTED***"
      - path: url
        pattern: "(api_key|token|secret)=([^&]+)"
        replace: "$1=***REDACTED***"
    risk: 60

  - id: approve-dangerous-shell
    when:
      server: demo-shell
      tool: run
      args:
        command: { matches: "(rm\\s+-rf|sudo|mkfs|dd\\s+if=)" }
    action: require_approval
    risk: 99
    reason: "高危 shell 需要人工批准"
```

### 7.2 决策优先级

1. 按规则列表**自上而下**匹配，命中即停（first match wins）。  
2. 脱敏规则可在 `allow` / `require_approval` 前作为独立预处理阶段执行（配置项 `pre_redact: true`）。  
3. 所有决策写审计，包括 `tools/list` 的可见性过滤（P0：可只记录；P0.5：支持按策略隐藏高危工具）。

### 7.3 风险分

- 规则声明 `risk`（0–100）为基线。  
- 可选 LLM 辅助器仅加减分（±20），**不能单独改写 action**。  
- MVP 可先不上 LLM 辅助，用纯规则；预留接口 `RiskScorer`。

## 8. 数据模型

### 8.1 本地（SQLite）

| 表 | 用途 |
| --- | --- |
| `policy_revisions` | 本地策略版本与原文哈希 |
| `audit_events` | 每次工具调用决策 |
| `approvals` | 审批单状态：pending/approved/denied/expired |
| `downstream_servers` | 下游 MCP 配置快照 |
| `sync_outbox` | 待同步到云的脱敏审计 |

`audit_events` 关键字段：`id`、`ts`、`server`、`tool`、`action`、`matched_rule_id`、`risk`、`latency_ms`、`args_redacted_json`、`result_status`、`client_name`、`session_id`。

### 8.2 云端（Supabase）

| 表 | 用途 |
| --- | --- |
| `profiles` | GitHub 用户 |
| `workspaces` | 单用户默认 1 个 workspace（为将来团队预留） |
| `policies` | 云端策略文档与版本 |
| `audit_events_cloud` | 脱敏后的审计 |
| `approvals_cloud` | Web 审批状态，与本地 approval id 关联 |
| `demo_fixtures` | 公开 Demo 只读数据 |

RLS：用户只能读写自己的 workspace；`demo` 公开读。

## 9. 目录结构（目标态）

```text
mcp-guardian/
├── apps/
│   └── web/                      # Next.js Dashboard + Landing + Demo
├── packages/
│   ├── gateway/                  # CLI + MCP proxy + local SQLite
│   ├── policy-engine/            # YAML load + match + redact
│   ├── shared/                   # Zod schemas, types, error codes
│   └── demo-servers/             # demo-fs / demo-shell / demo-http
├── policies/
│   ├── default.fail-closed.yaml
│   └── demos/
├── scenarios/                    # 红队脚本与期望结果
├── docs/
│   ├── product-plan.md           # 本文件
│   ├── development-plan.md       # 四周推进计划
│   ├── architecture.md
│   └── superpowers/plans/
├── .github/workflows/ci.yml
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── README.md
└── PROJECT_STATUS.md
```

## 10. 与其它项目的关系

| 项目 | 关系 |
| --- | --- |
| Evidence Graph | 同属作品集；EG 验证「可追溯研究」后，Guardian 验证「可控制出站工具」；未来可做联合 Demo，但不在 MVP 耦合代码 |
| AI Photo Studio CN | 无代码依赖；作品集 Work 页并列展示 |
| 个人作品集站点 | 由 Evidence Graph 仓库承载公开首页；Guardian 自带 `/` 落地页，并在 EG Work 列表中挂案例链接 |

**资源分配规则（锁定）**

1. Evidence Graph 未达公开演示前：只维护本方案与脚手架，不抢主开发带宽。  
2. Guardian 正式四周冲刺期间：Photo Studio 仅处理阻塞级 bug；EG 仅做稳定性修补。  
3. Guardian MVP 验收后：进入“低维护 + 公开案例”状态，不再主动加功能，除非有真实用户反馈。

## 11. 成功标准

### 11.1 产品成功（MVP）

- A1–A8 验收场景全部自动化或脚本可重复通过  
- 陌生人看落地页 60 秒内能说出产品是干什么的  
- 至少 1 篇 Case Study：问题、架构、关键决策、拦截演示 GIF/视频、仓库链接  
- CI：`lint` + `typecheck` + `unit` + `scenario` 全绿  

### 11.2 作品集成功

- 与 Photo Studio、Evidence Graph 形成清晰能力三角叙事  
- 面试/展示时可现场：改一条 YAML → 触发拦截 → 打开回放  

### 11.3 明确不作为成功标准

- 付费用户数、MRR  
- 企业安全认证  
- GitHub Star 数量  

## 12. 风险与缓解

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| MCP 传输协议演进（SSE → Streamable HTTP） | Gateway 适配成本 | 以官方 SDK 为边界，抽象 `TransportAdapter` |
| 审批体验拖慢 Agent | 用户关掉 Guardian | 默认只对高危规则要求审批；提供 TTL 与批量批准 |
| 与 Langfuse 被误比较 | 叙事混乱 | 落地页首屏明确 “Pre-call policy，不是 post-call trace” |
| 本地密钥误同步到云 | 信任崩塌 | 默认只上传脱敏审计；CI 测试禁止明文 secret 出站 |
| 四周范围膨胀 | 做不完 | P0 清单冻结；任何新想法进 P1 池 |

## 13. 发布与分发

1. GitHub 公开仓库（Apache-2.0 或 MIT，实施时二选一写死为 MIT）  
2. npm 包：`mcp-guardian`（gateway CLI）  
3. Web：`https://mcp-guardian.vercel.app`（或后续自定义域名）  
4. README 提供 Cursor `mcp.json` 配置片段  
5. `/demo` 预置回放，不依赖访客安装 CLI  

## 14. 文档交付物（本阶段）

| 文件 | 作用 |
| --- | --- |
| `docs/product-plan.md` | 产品总方案（本文件，决策源） |
| `docs/development-plan.md` | 四周推进与每日验收 |
| `docs/architecture.md` | 实施时补齐模块时序与错误码（启动编码前完成） |
| `PROJECT_STATUS.md` | 启动开发后的轻量进度面板 |
| `README.md` | 对外说明与快速开始（脚手架阶段最小版） |

---

**本方案即产品宪法。** 后续 Agent 实施时：只允许澄清技术细节，不允许静默扩大 P0 范围。若需改 P0，必须先改本文件并留下决策记录。
