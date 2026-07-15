# GitHub 使用与自动化最佳实践

仓库：`Ailian0206/mcp-guardian`  
可见性：Public  
默认分支：`main`  
工具：`git` + `gh` + Cursor Bugbot

## 日常闭环

1. 从 `main` 拉模块分支。  
2. 模块内小步 commit（中文 Conventional Commit）。  
3. 模块收口：本地 `pnpm lint && pnpm typecheck && pnpm test`。  
4. 推送并创建 **Draft PR**（不要每个小任务都开 PR）。  
5. 处理 CI / Bugbot 有效 findings。  
6. Ready for review 后用 **Create a merge commit** 合并：`gh pr merge <n> --merge --delete-branch`。  
7. 更新 `PROJECT_STATUS.md`，继续周期内下一模块；周期结束后停止等待人工审核。

## 分支命名

| 类型 | 格式 |
| --- | --- |
| 功能 | `feat/<topic>` |
| 修复 | `fix/<topic>` |
| 文档 | `docs/<topic>` |
| CI | `ci/<topic>` |

`main` 只接受已通过门禁的模块 PR，禁止直接推送业务改动。

## PR 模板要点

- 变更内容 / 原因 / 影响范围 / 验证命令 / 风险点  
- 合并方式固定为 merge commit  

## Agent 边界

- 自主完成当前有限周期内的模块实现 → PR → CI 修复 → 合并。  
- 不静默开启下一开发周期。  
- 密钥、npm publish、高风险不可逆操作先确认。
