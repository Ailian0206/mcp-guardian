# MCP Guardian Agent Workflow

## Product boundary

MCP Guardian is a pre-call policy gateway for MCP `tools/call`: allow / deny / redact / require_approval, plus audit replay.

Do not turn this into a generic Agent Trace platform, Prompt firewall, billing product, or multi-tenant enterprise SOC suite in the MVP.

Related portfolio projects (separate repos):

- `evidence-graph`: traceable research agent
- `ai-photo-studio-cn`: multimodal photo SaaS

## Engineering priorities

1. Deterministic, explainable policy decisions.
2. Local-first gateway; cloud dashboard is optional sync.
3. Never upload plaintext secrets by default.
4. Reproducible CI: `pnpm lint && pnpm typecheck && pnpm test`.

## GitHub + Claude PR 审核（强制，替代 Bugbot）

完整说明见 `docs/github-automation-playbook.md` 与 `.cursor/rules/pr-review-gate.mdc`。摘要：

1. 从 `main` 拉**里程碑大切片**分支；分支内小步中文 Conventional Commit（可 push，**默认仍不开 PR**）。  
2. **开放 PR 上限 = 1**；**只有里程碑意义才开 PR**（整周/大切片验收完成）。禁止按天、按小修复、纯文档单独开 PR。  
3. 开出 PR 后 Claude **只审一次**：  
   - 普通：`claude --permission-mode auto --model sonnet -p "/pr-review"`  
   - 触及审核协议路径：从准确 `baseRefOid` detached worktree 跑 `/pr-review --trusted-base <PR>`  
4. **有问题**：Claude 评论 → 开发 agent 同分支按评论修复 → push → **不再复审** → 本地+CI 绿后直接 merge。  
5. **没问题**：本地+CI 绿后直接 merge。  
6. 一键：`bash scripts/pr-gate.sh <PR>`；修完待合用 `SKIP_PR_REVIEW=1 bash scripts/pr-gate.sh <PR>`。  
7. **不得**手工改审核标签或冒充审核评论；Bugbot 不再作门禁。

Branch prefixes: `feat/`, `fix/`, `docs/`, `ci/`, `chore/`（`docs/` 分支默认只作合并进功能 PR 的载体，不单独提 PR）。

## Cost and external-write gates

Require explicit user authorization:

- Adding real cloud API keys for production sync smoke.
- Publishing npm packages.
- Changing license or making the repo private.

## Decision source

`docs/product-plan.md` is the constitution. P0 scope changes require editing that file first.
