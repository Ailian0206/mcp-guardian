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

## GitHub workflow

Mirror `ai-photo-studio-cn` / `evidence-graph`:

1. Inspect `git status -sb` and `PROJECT_STATUS.md`.
2. Work on a module branch from `main` (never commit product work directly to `main`).
3. Small Chinese Conventional Commits on the module branch.
4. At module milestone: full gate → push → **Draft PR**.
5. Read CI / Bugbot findings; fix on the same branch.
6. Convert to Ready and merge with `gh pr merge <n> --merge --delete-branch` (Create a merge commit, not squash).
7. Update `PROJECT_STATUS.md` before merge; continue next module in the current cycle only.

Branch prefixes: `feat/`, `fix/`, `docs/`, `ci/`, `chore/`.

## Cost and external-write gates

Require explicit user authorization:

- Adding real cloud API keys for production sync smoke.
- Publishing npm packages.
- Changing license or making the repo private.

## Decision source

`docs/product-plan.md` is the constitution. P0 scope changes require editing that file first.
