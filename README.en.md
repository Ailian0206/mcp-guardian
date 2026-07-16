# MCP Guardian

Pre-call policy gateway for MCP `tools/call`: **allow / deny / redact / require_approval**, plus audit replay.

Repository: <https://github.com/Ailian0206/mcp-guardian>

## Status

**Week 4 MVP (local-ready)**: policy engine, gateway, approvals, web dashboard, red-team scenarios, Playwright smoke.  
Production URL is optional; see [`docs/case-study.md`](docs/case-study.md).

## What it does

Intercepts MCP tool calls **before** execution—not a Langfuse/LangSmith-style trace platform (post-hoc observability).

| Action | Meaning |
| --- | --- |
| allow | proceed |
| deny | block |
| redact | rewrite sensitive args, then proceed |
| require_approval | hold until a human approves |

Default **fail-closed**: unmatched rules → deny.

## Quick start

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test
pnpm build

pnpm guardian eval --policy policies/default.fail-closed.yaml \
  --server demo-fs --tool read_file --args '{"path":"/workspace/a.txt"}'

bash scenarios/a1-a8.sh
pnpm dev:web          # http://127.0.0.1:3040
pnpm test:e2e
```

## Demo recording

```bash
bash scripts/record-demo.sh
# → docs/assets/demo-walkthrough.webm (+ .gif if ffmpeg is installed)
```

## Docs

| Doc | Purpose |
| --- | --- |
| [Product plan](docs/product-plan.md) | scope constitution |
| [Case study](docs/case-study.md) | portfolio narrative |
| [P1 backlog](docs/p1-backlog.md) | post-MVP ideas |

## License

MIT
