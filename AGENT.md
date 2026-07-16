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

1. 从 `main` 拉**周级大切片**分支；分支内小步中文 Conventional Commit（可 push，默认仍不开 PR）。  
2. **开放 PR 上限 = 1**；至少完成一整周验收才开 PR。纯文档/状态面板禁止单独开 PR。  
3. 开出或更新 PR 后必须触发独立 Claude 审核：  
   - 普通 PR：`claude --permission-mode auto --model sonnet -p "/pr-review"`  
   - 触及审核协议路径：从准确 `baseRefOid` detached worktree 运行 `/pr-review --trusted-base <PR编号>`  
4. 出现 `claude-changes-requested` → 同分支修复 → push → 重新审核；**不得**手工改标签或冒充审核评论。  
5. 门禁全绿（本地 + CI + `claude-reviewed` 且无 `claude-changes-requested`，marker 匹配当前 head）后，**无需人工批准**即可：  
   `bash scripts/pr-gate.sh <PR编号>`（或 `gh pr merge <n> --merge --delete-branch`）  
6. Cursor Bugbot 额度耗尽期间不再作为合并门禁。

Branch prefixes: `feat/`, `fix/`, `docs/`, `ci/`, `chore/`（`docs/` 分支默认只作合并进功能 PR 的载体，不单独提 PR）。

## Cost and external-write gates

Require explicit user authorization:

- Adding real cloud API keys for production sync smoke.
- Publishing npm packages.
- Changing license or making the repo private.

## Decision source

`docs/product-plan.md` is the constitution. P0 scope changes require editing that file first.
