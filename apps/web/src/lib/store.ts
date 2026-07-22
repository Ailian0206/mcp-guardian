import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadPolicyFromYaml } from "@mcp-guardian/policy-engine";
import { DEFAULT_FAIL_CLOSED_POLICY_YAML } from "@/lib/default-policy-yaml";
import { listPublicDemoAudits } from "@/lib/demo-fixtures";

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

function emptyStore(): CloudStore {
  return {
    policies: { default: DEFAULT_FAIL_CLOSED_POLICY_YAML },
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

export type ActionStats = {
  allow: number;
  deny: number;
  redact: number;
  require_approval: number;
  total: number;
};

export function computeActionStats(audits: CloudAudit[]): ActionStats {
  const stats: ActionStats = {
    allow: 0,
    deny: 0,
    redact: 0,
    require_approval: 0,
    total: audits.length,
  };
  for (const a of audits) {
    if (a.action === "allow") stats.allow += 1;
    else if (a.action === "deny") stats.deny += 1;
    else if (a.action === "redact") stats.redact += 1;
    else if (a.action === "require_approval") stats.require_approval += 1;
  }
  return stats;
}

export function seedDemoFixtures(): CloudStore {
  const store = readStore();
  let dirty = false;
  // 公开 Demo 样例来自纯数据模块；仅在缺失时写入 store，避免覆盖 sync
  for (const item of listPublicDemoAudits()) {
    if (!store.audits.some((a) => a.id === item.id)) {
      store.audits.push(item);
      dirty = true;
    }
  }
  if (dirty) writeStore(store);
  return store;
}

/**
 * 登录用户首次进入 Dashboard 时注入可验收样例：
 * - 1 条 pending 高危 shell（对应 A5）
 * - 若干归属该用户的审计（Dashboard 统计不为空）
 */
export function ensureUserFixtures(owner: string): CloudStore {
  const store = readStore();
  let dirty = false;
  const pendingId = `user-${owner}-approval-shell`;
  if (!store.approvals.some((a) => a.id === pendingId)) {
    store.approvals.unshift({
      id: pendingId,
      status: "pending",
      server: "demo-shell",
      tool: "run",
      args_redacted: { command: "rm -rf /tmp/mcp-guardian-demo" },
      reasons: ["高危 shell 需要人工批准（本地验收样例 A5）"],
      created_at: new Date().toISOString(),
      decided_at: null,
      owner,
    });
    dirty = true;
  }

  const userAudits: CloudAudit[] = [
    {
      id: `user-${owner}-audit-allow`,
      ts: new Date().toISOString(),
      server: "demo-fs",
      tool: "read_file",
      action: "allow",
      matched_rule_id: "allow-workspace-read",
      risk: 10,
      result_status: "ok",
      args_redacted: { path: "/workspace/notes.md" },
      reasons: ["允许工作区读取"],
      owner,
    },
    {
      id: `user-${owner}-audit-deny`,
      ts: new Date().toISOString(),
      server: "demo-fs",
      tool: "write_file",
      action: "deny",
      matched_rule_id: "deny-system-write",
      risk: 95,
      result_status: "denied",
      args_redacted: { path: "/etc/hosts", content: "***" },
      reasons: ["拒绝写入系统目录"],
      owner,
    },
    {
      id: `user-${owner}-audit-redact`,
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
      owner,
    },
    {
      id: `user-${owner}-audit-approval`,
      ts: new Date().toISOString(),
      server: "demo-shell",
      tool: "run",
      action: "require_approval",
      matched_rule_id: "approve-dangerous-shell",
      risk: 99,
      result_status: "pending_approval",
      args_redacted: { command: "rm -rf /tmp/mcp-guardian-demo" },
      reasons: ["高危 shell 需要人工批准"],
      owner,
    },
  ];
  for (const item of userAudits) {
    if (!store.audits.some((a) => a.id === item.id)) {
      store.audits.unshift(item);
      dirty = true;
    }
  }

  if (!store.policies.default || store.policies.default.length < 80) {
    store.policies.default = DEFAULT_FAIL_CLOSED_POLICY_YAML;
    dirty = true;
  }

  if (dirty) writeStore(store);
  return store;
}
