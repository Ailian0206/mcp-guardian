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

1. 从 `main` 拉模块分支；分支内小步中文 Conventional Commit。  
2. **只有模块验收目标全部通过后才开 PR**（Bugbot 按 PR 计费，严禁频繁开 PR）。  
3. 开 PR 后立刻派**后台子代理**监听 Cursor Bugbot / Autofix；**主进程不要干等**，继续下一模块。  
4. **禁止与 Autofix 抢修同一 finding**；等子代理回报后再审。  
5. Autofix 可接受 → `gh pr merge <n> --merge --delete-branch`；有问题 → **在同一 PR 分支**修改并 push，**不要再开新 PR**。  
6. 更新 `PROJECT_STATUS.md`；周期内可并行下一模块，周期结束后停止等待人工审核。

Branch prefixes: `feat/`, `fix/`, `docs/`, `ci/`, `chore/`.

## Cost and external-write gates

Require explicit user authorization:

- Adding real cloud API keys for production sync smoke.
- Publishing npm packages.
- Changing license or making the repo private.

## Decision source

`docs/product-plan.md` is the constitution. P0 scope changes require editing that file first.
Bugbot 流程以 `docs/github-automation-playbook.md` 为准。
