#!/usr/bin/env node
import path from "node:path";
import { PACKAGE_NAME } from "@mcp-guardian/shared";
import { AuditStore } from "./audit.js";
import { evalToolCall, startProxy } from "./index.js";

function usage(): never {
  console.error(`Usage:
  ${PACKAGE_NAME} eval --policy <file> --server <name> --tool <name> [--args <json>]
  ${PACKAGE_NAME} start --config <file>
  ${PACKAGE_NAME} audits list [--limit N]
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

  if (cmd === "audits" && rest[0] === "list") {
    const limitRaw = flag(rest, "--limit");
    const store = new AuditStore();
    const rows = store.list(limitRaw ? Number(limitRaw) : 20);
    console.log(JSON.stringify(rows, null, 2));
    store.close();
    return;
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
