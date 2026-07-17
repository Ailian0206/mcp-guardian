# MCP Guardian Agent Workflow

## Product boundary

MCP Guardian is a pre-call policy gateway for MCP `tools/call`: allow / deny / redact / require_approval, plus audit replay.

Do not turn this into a generic Agent Trace platform, Prompt firewall, billing product, or multi-tenant enterprise SOC suite in the MVP.

Related portfolio projects（**本 agent 不负责改这些仓，除非用户点名**）:

- `evidence-graph`
- `ai-photo-studio-cn`

## Engineering priorities

1. Deterministic, explainable policy decisions.
2. Local-first gateway; cloud dashboard is optional sync.
3. Never upload plaintext secrets by default.
4. Reproducible CI: `pnpm lint && pnpm typecheck && pnpm test`.

## GitHub + Claude PR（成本红线）

完整说明：`docs/github-automation-playbook.md`、`.cursor/rules/pr-review-gate.mdc`。

1. 里程碑分支内小步 commit（可 push），**默认不开 PR**。  
2. 开 PR 前：`bash scripts/assert-can-open-pr.sh`；**只有里程碑**才 `ALLOW_OPEN_PR=1` 后创建；开放 PR ≤ 1。  
3. Claude **每个 PR 只审一次**（`pr-gate.sh` 有 flock；已审过则拒绝对第二次 `claude`）。  
4. 有问题：修 → `SKIP_PR_REVIEW=1` → merge；**禁止复审**。  
5. 没问题：一次 gate 后 merge。  
6. **禁止**并发审核；**禁止**为烧额度再跑 Bugbot。  
7. 不得手改审核标签或冒充审核评论。

## Cost and external-write gates

Require explicit user authorization:

- Adding real cloud API keys for production sync smoke.
- Publishing npm packages.
- Changing license or making the repo private.
- Touching any repo other than `mcp-guardian`.

## Decision source

`docs/product-redesign-2026-07-16.md`（主路径）与 `docs/product-plan.md`（历史）。P0 变更先改决策文档。
