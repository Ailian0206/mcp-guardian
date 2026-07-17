#!/usr/bin/env node
import path from "node:path";
import { PACKAGE_NAME } from "@mcp-guardian/shared";
import { ApprovalStore } from "./approvals.js";
import { AuditStore } from "./audit.js";
import { evalToolCall, startProxy } from "./index.js";
import { installClients } from "./install-client.js";

function usage(): never {
  console.error(`Usage:
  ${PACKAGE_NAME} eval --policy <file> --server <name> --tool <name> [--args <json>]
  ${PACKAGE_NAME} start --config <file>
  ${PACKAGE_NAME} install [--cursor] [--codex] [--all] [--profile demos|filesystem] [--workspace <dir>]
  ${PACKAGE_NAME} audits list [--limit N]
  ${PACKAGE_NAME} audits show <id>
  ${PACKAGE_NAME} approvals list
  ${PACKAGE_NAME} approvals decide <id> --allow|--deny

Notes:
  install              默认 profile=demos（三演示下游）
  --profile filesystem 官方 Filesystem MCP；建议加 --workspace <绝对目录>
  高危/写入审批：Agent 对话内 guardian_decide（allow 须带 confirm_code）
`);
  process.exit(2);
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd) usage();

  if (cmd === "eval") {
    const policy = flag(rest, "--policy");
    const server = flag(rest, "--server");
    const tool = flag(rest, "--tool");
    const argsJson = flag(rest, "--args") ?? "{}";
    if (!policy || !server || !tool) usage();
    const decision = evalToolCall({
      policyFile: path.resolve(policy),
      server,
      tool,
      argsJson,
    });
    console.log(JSON.stringify(decision, null, 2));
    process.exit(decision.action === "deny" ? 1 : 0);
  }

  if (cmd === "start") {
    const config = flag(rest, "--config");
    if (!config) usage();
    await startProxy({ configPath: path.resolve(config) });
    return;
  }

  if (cmd === "install") {
    const all = rest.includes("--all");
    const cursor = all || rest.includes("--cursor");
    const codex = all || rest.includes("--codex");
    const targets =
      !cursor && !codex
        ? { cursor: true, codex: true }
        : { cursor, codex };
    const profileRaw = flag(rest, "--profile") ?? "demos";
    if (profileRaw !== "demos" && profileRaw !== "filesystem") {
      console.error("--profile 仅支持 demos | filesystem");
      process.exit(2);
    }
    const workspace = flag(rest, "--workspace");
    const result = installClients(targets, {
      profile: profileRaw,
      ...(workspace ? { workspace } : {}),
    });
    for (const m of result.messages) console.log(m);
    return;
  }

  if (cmd === "audits" && rest[0] === "list") {
    const limitRaw = flag(rest, "--limit");
    const store = new AuditStore();
    const rows = store.list(limitRaw ? Number(limitRaw) : 20);
    console.log(JSON.stringify(rows, null, 2));
    store.close();
    return;
  }

  if (cmd === "audits" && rest[0] === "show") {
    const id = rest[1];
    if (!id) usage();
    const store = new AuditStore();
    const row = store.get(id);
    console.log(JSON.stringify(row ?? null, null, 2));
    store.close();
    process.exit(row ? 0 : 1);
  }

  if (cmd === "approvals" && rest[0] === "list") {
    const store = new ApprovalStore();
    console.log(JSON.stringify(store.listPending(), null, 2));
    store.close();
    return;
  }

  if (cmd === "approvals" && rest[0] === "decide") {
    const id = rest[1];
    const allow = rest.includes("--allow");
    const deny = rest.includes("--deny");
    if (!id || allow === deny) usage();
    const store = new ApprovalStore();
    const row = store.decide(id, allow);
    console.log(JSON.stringify(row ?? null, null, 2));
    store.close();
    process.exit(row?.status === "approved" || row?.status === "denied" ? 0 : 1);
  }

  usage();
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  return argv[i + 1];
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
