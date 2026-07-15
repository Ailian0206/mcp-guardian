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

## GitHub + Bugbot workflow（强制）

完整说明见 `docs/github-automation-playbook.md`。摘要：

1. 从 `main` 拉**周级大切片**分支；分支内小步中文 Conventional Commit（可 push，默认仍不开 PR）。  
2. **开放 PR 上限 = 1**；至少完成一整周验收才开 PR。纯文档/状态面板禁止单独开 PR。  
3. 开 PR 后立刻派**后台子代理**听 Bugbot/Autofix；主进程可继续下一周**本地开发**，但**等当前 PR 合并后再开下一个 PR**。  
4. **禁止与 Autofix 抢修同一 finding**。  
5. Autofix 可接受 → `gh pr merge <n> --merge --delete-branch`；有问题 → 同 PR 分支补修，不新开 PR。  

Branch prefixes: `feat/`, `fix/`, `docs/`, `ci/`, `chore/`（`docs/` 分支默认只作合并进功能 PR 的载体，不单独提 PR）。
## Cost and external-write gates

Require explicit user authorization:

- Adding real cloud API keys for production sync smoke.
- Publishing npm packages.
- Changing license or making the repo private.

## Decision source

`docs/product-plan.md` is the constitution. P0 scope changes require editing that file first.
Bugbot 流程以 `docs/github-automation-playbook.md` 为准。
