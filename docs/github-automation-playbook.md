# GitHub 使用与自动化最佳实践

仓库：`Ailian0206/mcp-guardian`  
可见性：Public  
默认分支：`main`  
工具：`git` + `gh` + Cursor Bugbot

## 1. 核心原则（成本优先）

1. **少开 PR**：每次 PR 都会触发 Cursor Bugbot，成本很高。  
2. **只在模块目标验收完成后开 PR**：模块分支内可以多次本地 commit / push，但**不要**为每个小任务开 PR。  
3. **开 PR 后把修复权先交给 Bugbot Autofix**：主 Agent **不得与 Autofix 抢修同一 finding**。  
4. **主进程不干等**：派子代理监听 Bugbot；主进程继续下一开发任务；子代理回报后再审核 Autofix。

## 2. 日常闭环

```text
main
  → 拉模块分支 feat/<module>
  → 分支内小步 commit（本地验证）
  → 模块验收目标全部通过（lint/typecheck/test/场景）
  → 推送分支 + 开唯一 Draft PR          ← 本模块只开这一次 PR
  → 派「Bugbot 监听」子代理（后台）
  → 主进程立刻开始下一模块开发（新分支，不碰该 PR）
  → 子代理回报 Autofix / Bugbot 状态
  → 主进程审核 Autofix：通过则 merge；有问题则在同一 PR 分支直接改并 push（不再开新 PR）
```

### 2.1 何时才允许开 PR

必须同时满足：

- 当前模块的有限任务清单已完成  
- 本地完整门禁已绿：`pnpm lint && pnpm typecheck && pnpm test`（及该模块场景脚本）  
- `PROJECT_STATUS.md` 已写清本模块验收结果与不做项  
- **不是**「先开 PR 再边改边补」

禁止：

- 每个小 fix / 文档微调单独开 PR  
- 模块未验收就开 PR「占坑」  
- 同一模块为修 Bugbot 再开第二个 PR（应在原 PR 分支继续）

### 2.2 分支命名

| 类型 | 格式 |
| --- | --- |
| 功能 | `feat/<topic>` |
| 修复 | `fix/<topic>` |
| 文档 | `docs/<topic>` |
| CI | `ci/<topic>` |

`main` 只接受已通过门禁的模块 PR，禁止直接推送业务改动。

## 3. Cursor Bugbot 与 Autofix 协作

### 3.1 预期行为

- PR 创建后 Bugbot 跑检查；有问题会留下 findings。  
- 若仓库启用了 Autofix（推荐 **Commit to Existing Branch**，或 Create New Branch）：Cloud Agent 会自动修复并推到远程。  
- Autofix 消耗 Cloud Agent credits，因此更要控制 PR 频率。

### 3.2 主 Agent 禁令（开 PR 之后）

在子代理确认「Bugbot/Autofix 已结束或无需 Autofix」之前：

1. **不要**自行按 Bugbot 评论改同一批 finding 并 push（避免与 Autofix 冲突 / 重复计费）。  
2. **不要**为同一 finding 再开 PR。  
3. **不要**阻塞式轮询干等；应派子代理监听，自己做下一模块。

### 3.3 子代理：Bugbot 监听（必派）

开完模块 PR 后，**立即**派一个后台子代理，职责仅限：

1. 用 `gh pr checks` / `gh pr view` / PR 评论跟踪 `Cursor Bugbot` 状态。  
2. 观察是否出现 Autofix commit（同一分支或 Autofix 新分支）。  
3. 等 Bugbot check 结束，且 Autofix 不再有进行中的修复（或明确无 findings）。  
4. 向主进程回报：
   - Bugbot 最终状态（pass / findings 摘要）  
   - Autofix 是否提交、commit SHA、改了哪些文件  
   - 建议：`approve-merge` / `needs-human-review` / `needs-manual-fix`

子代理**禁止**：

- 自己改业务代码去「抢修」Autofix 正在修的问题  
- 合并 PR  
- 开启新的功能开发

### 3.4 主进程：并行下一模块

子代理监听期间，主进程应：

1. 从最新 `main`（或确认不依赖该 PR 的基线）拉 **下一个模块分支**。  
2. 继续实现与测试，本地 commit 即可。  
3. **不要** push 到正在等 Bugbot 的 PR 分支（除非子代理已回报且进入审核阶段）。  
4. 下一模块也要等自身验收完成后再开 PR（继续少开 PR）。

### 3.5 子代理回报后的审核与合并

| 情况 | 动作 |
| --- | --- |
| 无 findings，CI 绿 | Ready → `gh pr merge <n> --merge --delete-branch` |
| Autofix 已推修复，审阅通过 | 同一 PR 直接 merge（不要为 Autofix 再开 PR） |
| Autofix 有误 / 不足 | 在 **原 PR 分支** 上修改、本地验证、`git push`（仍不新开 PR） |
| Autofix 开在独立分支 | 审查后合入原 PR 分支或按 Cursor 提示合并，最终只保留一条合入 `main` 的模块 PR |

合并方式固定：**Create a merge commit**（`--merge`），不用 squash/rebase。

## 4. PR 模板要点

- 变更内容 / 原因 / 影响范围 / 验证命令 / 风险点  
- 写明：本模块验收已完成；开 PR 后由 Bugbot/Autofix 优先处理 findings  
- 合并方式固定为 merge commit  

## 5. Agent 边界

- 自主完成当前有限周期内的模块实现 →（验收后）唯一模块 PR → 子代理听 Bugbot → 主进程并行下一模块 → 审核后合并。  
- 不静默开启下一**开发周期**（周期级仍需用户授权）；周期内下一**模块**可并行。  
- 密钥、npm publish、高风险不可逆操作先确认。

## 6. 配置入口

- Bugbot Dashboard：<https://www.cursor.com/dashboard/bugbot>  
- 本仓库建议 Autofix：Commit to Existing Branch（或 Create New Branch，由子代理跟踪修复分支）
