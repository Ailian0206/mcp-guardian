# MCP Guardian 四周推进计划

> 日期：2026-07-15  
> 状态：已锁定  
> 前置条件：仓库已创建；Week 0 CI 绿后进入 Week 1  
> 决策源：[`product-plan.md`](./product-plan.md)  
> 执行原则：按周交付可演示增量；每日以验收命令为准；不扩大 P0。  
> 变更（2026-07-15）：用户授权直接创建 GitHub 并按计划推进；原「等 Evidence Graph 公开演示」门槛不再阻塞工程实施。

## 0. 启动门槛（Go / No-Go）

进入 Week 1 前需满足：

1. GitHub 仓库 `Ailian0206/mcp-guardian` 已创建。  
2. 本仓库已初始化：pnpm workspace、CI 空跑、README 最小版。  
3. `docs/architecture.md` 已写完模块边界与错误码。  
4. 开发者机器可运行 Node 22 + pnpm。

## 1. 总览

| 周 | 主题 | 结束时必须能演示的东西 |
| --- | ---: | --- |
| W0 | 脚手架与架构冻结 | 空 monorepo + CI + 文档齐全 |
| W1 | Policy Engine + 本地 Gateway | YAML 策略拦截本地 demo-fs |
| W2 | 审批 + 审计回放 + Demo Servers | A1–A5 本地全通（CLI 审批） |
| W3 | Web Dashboard + 云同步 | 浏览器批准 + 审计列表 |
| W4 | 红队套件 + 落地页 + 公开 Demo | A1–A8；作品集可展示 |
| W5 | 仅包装 | Case Study、GIF、README 打磨；**不加功能** |

W5 为缓冲周，默认 3 天内结束。

## 2. Week 0：脚手架（1–2 天）

### 交付

- [ ] GitHub 仓库 `mcp-guardian`（MIT）
- [ ] pnpm workspace：`apps/web`、`packages/gateway`、`packages/policy-engine`、`packages/shared`、`packages/demo-servers`
- [ ] Vitest + ESLint + TypeScript project references
- [ ] GitHub Actions：`lint` / `typecheck` / `test`
- [ ] `PROJECT_STATUS.md`、最小 `README.md`
- [ ] `architecture.md` 定稿

### 验收

```bash
pnpm lint && pnpm typecheck && pnpm test
```

CI 在空仓库上必须绿。

## 3. Week 1：策略引擎与最小 Gateway

### 目标

不接云、不做 Web；先证明 **策略可以拦住工具调用**。

### 任务拆分

1. `packages/shared`：Zod schema（Rule、Decision、AuditEvent、Approval）
2. `packages/policy-engine`：
   - 加载 YAML
   - first-match 评估
   - redact 路径改写
   - 单测覆盖匹配、脱敏、fail-closed 默认
3. `packages/demo-servers/demo-fs`：read/write 两个 tool
4. `packages/gateway`：
   - 读取 `mcp-guardian.yaml`（下游 server + policy path）
   - stdio 代理一轮 `tools/list` + `tools/call`
   - 决策写入本地 SQLite
5. CLI：`mcp-guardian eval --tool ...` 用于无 MCP 客户端时的单次评估调试

### 验收

- [ ] 单测：≥20 个策略引擎用例  
- [ ] 场景：允许 `/workspace/a.txt` 读取；拒绝写 `/etc/passwd`  
- [ ] `mcp-guardian start` + 配置 Cursor/`mcp` 客户端可打到 demo-fs  

对应产品验收：A1、A2。

## 4. Week 2：审批、脱敏、完整 Demo Servers

### 目标

本地闭环达到「危险操作可人工闸门 + 密钥可脱敏」。

### 任务拆分

1. `demo-shell`、`demo-http` 完成  
2. `require_approval` 流程：
   - 创建 pending approval  
   - CLI prompt / `mcp-guardian approvals decide <id> --allow`  
   - TTL 过期自动 deny  
3. 脱敏规则落地到 http fetch  
4. 审计查询 CLI：`mcp-guardian audits list` / `audits show <id>`  
5. `scenarios/` 下脚本化 A1–A5  

### 验收

- [ ] A1–A5 一键脚本通过  
- [ ] 审批超时单测通过  
- [ ] 审计中无明文 `sk-` / `Bearer` 样例密钥（用假密钥测试）  

## 5. Week 3：Web Dashboard 与可选云同步

### 目标

浏览器可管策略、批审批、看回放；云同步为增强，不阻断本地。

### 任务拆分

1. `apps/web` 初始化：落地页骨架、`/app` 布局  
2. Supabase：Auth（GitHub）、表迁移、RLS  
3. 页面：
   - `/app/policies` 查看/编辑 YAML（MVP 可用 textarea + 校验）  
   - `/app/approvals` 待办列表与一键批准  
   - `/app/audits` 列表与详情回放  
4. Gateway 同步：
   - 登录后写入 device token  
   - outbox 上传脱敏审计  
   - 拉取云端策略版本（可选开关）  
5. Web 批准通过 API 回写，Gateway 轮询或短轮询 pending approvals  

### 验收

- [ ] 未登录不能进 `/app`  
- [ ] A4 可在 Web 批准并完成执行  
- [ ] 断网时 Gateway 仍可用 CLI 批准（A7）  
- [ ] RLS 集成测试：用户 A 不可见用户 B 审计  

## 6. Week 4：红队、公开 Demo、打磨

### 目标

A1–A8 全通；陌生人可理解产品。

### 任务拆分

1. 6 个红队场景 + 期望断言  
2. `/demo` 预置只读回放（seed）  
3. 落地页：首屏价值主张、与 Langfuse 对比表、安装片段、Demo CTA  
4. 基础统计：allow/deny/redact/approval 计数  
5. Sentry + Vercel 部署  
6. README：Cursor 配置、快速开始、安全说明  
7. 更新 `PROJECT_STATUS.md` 为 MVP Done  

### 验收

- [ ] A1–A8 全部通过  
- [ ] Playwright：落地页、Demo 回放、登录门禁 smoke  
- [ ] Production URL 可访问  
- [ ] Case Study 初稿进 `docs/case-study.md`  

## 7. Week 5：包装周（不加功能）

- [x] 录制 30–60 秒演示 GIF/视频（`scripts/record-demo.sh` → `docs/assets/`）  
- [x] Evidence Graph Work 页增加 MCP Guardian 条目（独立仓分支 `chore/mcp-guardian-portfolio-entry`）  
- [x] 英文 README 摘要（`README.en.md`）  
- [x] 冻结 P0；`docs/p1-backlog.md` 已收纳后续想法  

## 8. 每日工作节奏（执行期）

1. 打开 `PROJECT_STATUS.md`，只推进当天勾选任务  
2. 先写/改测试或 scenario，再写实现  
3. 一天至少一次：`pnpm lint && pnpm typecheck && pnpm test`  
4. 每完成一个可演示增量就 commit（中文 Conventional Commit）  
5. 当天结束更新 `PROJECT_STATUS.md` 的「下一步」  

## 9. 范围变更规则

1. 任何新功能默认进 P1 backlog。  
2. 只有阻断 A1–A8 的缺陷才允许插入当前周。  
3. 若某周延期：优先砍 Web 美化与云同步，**不砍**策略引擎、审批、本地审计、红队场景。  
4. 砍优先级（从先砍到后砍）：落地页动效 → 云策略双向同步 → Web YAML 编辑体验 → LLM 风险辅助 → 工具列表过滤。  

## 10. 里程碑检查清单（给最终验收用）

复制以下清单，全部勾选即视为产品计划完成：

- [ ] 本地 `mcp-guardian start` 可代理至少一个真实 MCP Client  
- [ ] fail-closed 默认策略生效  
- [ ] allow / deny / redact / require_approval 四种动作均有自动化证明  
- [ ] CLI 与 Web 两条审批路径可用  
- [ ] 公开 `/demo` 无需登录  
- [ ] 落地页讲清与 Trace 平台差异  
- [ ] CI 全绿，Production 可访问  
- [ ] Case Study 与演示素材就绪  
- [ ] P1 backlog 已单列，P0 已冻结  

---

**执行口令（给后续 Agent）**：按本计划从当前 Week 序号继续；不要重开产品讨论；冲突时以 `product-plan.md` 为准。
