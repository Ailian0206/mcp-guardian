import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadPolicyFromYaml } from "@mcp-guardian/policy-engine";

export type CloudApproval = {
  id: string;
  status: "pending" | "approved" | "denied" | "expired";
  server: string;
  tool: string;
  args_redacted: Record<string, unknown>;
  reasons: string[];
  created_at: string;
  decided_at: string | null;
  owner: string;
};

export type CloudAudit = {
  id: string;
  ts: string;
  server: string;
  tool: string;
  action: string;
  matched_rule_id: string | null;
  risk: number;
  result_status: string;
  args_redacted: Record<string, unknown>;
  reasons: string[];
  owner: string;
};

export type CloudStore = {
  policies: Record<string, string>;
  approvals: CloudApproval[];
  audits: CloudAudit[];
  devices: Record<string, { owner: string; created_at: string }>;
};

function dataDir(): string {
  const dir =
    process.env.MCP_GUARDIAN_WEB_DATA ??
    path.join(os.tmpdir(), "mcp-guardian-web-data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function storePath(): string {
  return path.join(dataDir(), "store.json");
}

const defaultPolicy = `version: 1
mode: fail_closed
rules:
  - id: allow-workspace-read
    when:
      server: demo-fs
      tool: read_file
      args:
        path: { matches: "^/workspace/" }
    action: allow
    risk: 10
  - id: deny-system-write
    when:
      server: demo-fs
      tool: write_file
      args:
        path: { matches: "^/(etc|var|usr)/" }
    action: deny
    risk: 95
  - id: redact-http-secrets
    when:
      server: demo-http
      tool: fetch
    action: redact
    risk: 60
  - id: approve-dangerous-shell
    when:
      server: demo-shell
      tool: run
      args:
        command: { matches: "(rm\\\\s+-rf|sudo)" }
    action: require_approval
    risk: 99
`;

function emptyStore(): CloudStore {
  return {
    policies: { default: defaultPolicy },
    approvals: [],
    audits: [],
    devices: {},
  };
}

export function readStore(): CloudStore {
  const file = storePath();
  if (!fs.existsSync(file)) {
    const initial = emptyStore();
    writeStore(initial);
    return initial;
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as CloudStore;
}

export function writeStore(store: CloudStore): void {
  fs.writeFileSync(storePath(), JSON.stringify(store, null, 2));
}

export function seedDemoFixtures(): CloudStore {
  const store = readStore();
  if (store.audits.some((a) => a.id === "demo-audit-1")) return store;
  store.audits.unshift(
    {
      id: "demo-audit-1",
      ts: new Date().toISOString(),
      server: "demo-fs",
      tool: "write_file",
      action: "deny",
      matched_rule_id: "deny-system-write",
      risk: 95,
      result_status: "denied",
      args_redacted: { path: "/etc/passwd", content: "***" },
      reasons: ["拒绝写入系统目录"],
      owner: "public",
    },
    {
      id: "demo-audit-2",
      ts: new Date().toISOString(),
      server: "demo-http",
      tool: "fetch",
      action: "redact",
      matched_rule_id: "redact-http-secrets",
      risk: 60,
      result_status: "ok",
      args_redacted: {
        url: "https://api.example.com?api_key=***REDACTED***",
        headers: { authorization: "***REDACTED***" },
      },
      reasons: ["matched rule redact-http-secrets"],
      owner: "public",
    },
  );
  writeStore(store);
  return store;
}

export function validatePolicyYaml(text: string): { ok: true } | { ok: false; error: string } {
  try {
    loadPolicyFromYaml(text);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
