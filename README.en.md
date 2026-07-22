# MCP Guardian

Local MCP policy middleware for **Cursor / Codex**: allow / deny / redact before `tools/call`; high-risk actions are approved **in the same Agent chat** via `confirm_code` + `guardian_decide`.

Repository: <https://github.com/Ailian0206/mcp-guardian>  
Live brochure: <https://ailian0206.github.io/mcp-guardian/> (GitHub Pages; no Dashboard API)  
Decision source: [`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)

## Status

**MVP + Milestone A (real Filesystem downstream) are on `main`.**  
Web is a product brochure (value / install / FAQ / live policy tryout)—not an approvals dashboard.  
See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) and [`docs/case-study.md`](docs/case-study.md).

## What it does

Intercepts MCP tool calls **before** execution—not a Langfuse/LangSmith-style trace platform.

| Action | Meaning |
| --- | --- |
| allow | proceed |
| deny | block |
| redact | rewrite sensitive args, then proceed |
| require_approval | hold until the user confirms in-chat; Agent calls `guardian_decide` with `confirm_code` |

Default **fail-closed**: unmatched rules → deny.

## One-shot install

```bash
git clone https://github.com/Ailian0206/mcp-guardian.git
cd mcp-guardian
bash scripts/install.sh
# Restart Cursor/Codex → MCP list shows mcp-guardian
```

Day-to-day product is the **local gateway**. Do **not** rely on the web approvals UI or a separate terminal `approvals decide` loop.

### Real downstream (official Filesystem MCP)

```bash
pnpm build
node packages/gateway/dist/cli.js install --cursor \
  --profile filesystem --workspace /ABS/PATH/TO/DIR
```

## Quick start (dev)

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test
pnpm build

bash scenarios/a1-a8.sh
bash scenarios/ide-smoke.sh
bash scenarios/real-filesystem.sh

pnpm dev:web          # http://127.0.0.1:3040 → /  /faq  /demo
pnpm build:pages      # static export → apps/web/out (GitHub Pages)
pnpm test:e2e
```

## Demo recording

```bash
bash scripts/record-demo.sh
# → docs/assets/demo-walkthrough.webm (+ .gif if ffmpeg is installed)
# Web also serves copies under apps/web/public/
```

## Docs

| Doc | Purpose |
| --- | --- |
| [Product redesign](docs/product-redesign-2026-07-16.md) | current delivery definition |
| [Case study](docs/case-study.md) | portfolio narrative |
| [P1 backlog](docs/p1-backlog.md) | post-MVP ideas |
| [Development plan](docs/development-plan.md) | historical week plan (superseded for delivery) |

## License

MIT
