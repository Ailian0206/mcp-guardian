# 产品再评估与锁定决策（2026-07-16）

> 状态：**取代**原 `product-plan.md` 中「双运行时 + Dashboard 主路径」的交付定义。  
> 决策权：Agent 全权定稿；用户只验收最终结果。  
> 触发：真实试用后发现 Web 操作台 / 外置 CLI 审批都不符合「装上 MCP 就能用」的直觉。

## 1. 一句话

**MCP Guardian = 装进 Cursor / Codex 的本地策略中间层。**  
Agent 调工具前自动 allow / deny / redact；高危时在 **同一次 Agent 对话里**问人、再继续。  
Web 只负责让陌生人 5 分钟看懂 + 一键安装说明 + FAQ。

## 2. 真实使用场景（只服务这个）

开发者已经在用 Cursor / Codex，并接了（或准备接）MCP 工具。担心 Agent：

- 乱写系统路径、乱跑 `rm -rf`
- 把 API Key 打进 URL / Header
- 出事后说不清「当时允不允许」

**他愿意做的事：** 跑一条安装命令，重启 IDE，然后继续正常跟 Agent 聊天。  
**他不愿意做的事：** 另开网页批每一刀、另开终端跑 `approvals decide`、学一套 Dashboard。

## 3. 工作方式（主路径）

```text
用户：bash scripts/install.sh → 重启 Cursor/Codex
Agent：正常 tools/call
  ├─ allow / redact → 直接执行（用户无感或仅见脱敏结果）
  ├─ deny → 工具返回明确拒绝（Agent 可解释给用户）
  └─ require_approval → 立刻返回 pending + 说明
        → Agent 在对话里问用户「是否批准」
        → 用户说批准/拒绝
        → Agent 调用同一 MCP 的 guardian_decide
        → 批准则执行原工具；拒绝则结束
本地 SQLite：审计可查（可选 MCP 工具 guardian_audits / CLI 调试）
```

**不做：** 把 Web Approvals 或外置 shell 审批当作日常流程。

## 4. Web 边界（重新锁定）

| 做 | 不做 |
| --- | --- |
| 产品介绍、与 Trace 差异 | 登录后的审批台作为主功能 |
| 一键安装说明 | 云同步审批（P1 以后再说） |
| FAQ | 策略云编辑 SaaS |
| 可选：公开页现场试跑策略（帮助理解，非生产路径） | 强迫用户为验收打开 Dashboard |

原 `/app/*` Dashboard：保留代码但不作为产品主路径；落地页不再导向「登录审批」。

## 5. 成功标准（你用来验收）

1. **安装**：一条 `bash scripts/install.sh`，Cursor/Codex 出现 `mcp-guardian`。  
2. **自动拦**：危险写 / 未匹配规则 → deny；密钥 → redact；工作区读 → allow。  
3. **会话内批**：高危调用后，Agent 能在对话里完成批准/拒绝并继续，无需另开 Web/终端。  
4. **Web**：打开站点只看到介绍 / 安装 / FAQ；不靠 Dashboard 才能「玩起来」。  
5. **作品集**：Evidence Graph Work 页能讲清上述主路径。

## 6. 明确不做（本期）

- 企业多租户、SOC2、SIEM
- 通用 Prompt 防火墙、Trace 平台
- 把 Guardian 耦进 Evidence Graph 运行时
- 频繁小 PR；仅里程碑整包更新现有 PR

## 7. 审批威胁模型（诚实）

会话内 `guardian_decide` **不是**与 Agent 密码学隔离的独立信道。强制点：

1. **allow 必须带 `confirm_code`**（与 `approval_required` 一致），否则拒绝。  
2. **外层人在环**：Cursor/Codex 对 MCP 工具调用的确认 UI——用户可拒绝 `guardian_decide`。  
3. 全自动、无视工具确认、且会读 pending payload 的 Agent，仍可能自批；本期接受该残差，换「装上就能在对话里批」的主路径。不恢复阻塞式 Web/CLI 审批为主路径。

## 8. 与旧方案差异（诚实）

| 旧 | 新 |
| --- | --- |
| Gateway + Web 双主 | Gateway 唯一运行时主路径 |
| 审批：CLI 或 Web 阻塞等待 | 审批：Agent 会话内 `guardian_decide` + confirm_code |
| 成功看 Dashboard | 成功看「装上就能在 IDE 里用」 |
| Web = 产品 | Web = 说明书 + FAQ + 作品集门面 |
