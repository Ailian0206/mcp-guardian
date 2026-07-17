import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AuditStore } from "./audit.js";
import type { Decision } from "@mcp-guardian/shared";

const decision: Decision = {
  action: "require_approval",
  risk: 99,
  matched_rule_id: "x",
  reasons: ["t"],
  redacted_args: { command: "rm -rf /tmp/x" },
  mode: "fail_closed",
};

describe("AuditStore", () => {
  const tmp: string[] = [];
  afterEach(() => {
    for (const d of tmp) fs.rmSync(d, { recursive: true, force: true });
    tmp.length = 0;
  });

  it("upserts same id from pending to approved", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mg-audit-"));
    tmp.push(dir);
    const store = new AuditStore(path.join(dir, "state.db"));
    store.append({
      id: "c1",
      server: "demo-shell",
      tool: "run",
      decision,
      latencyMs: 1,
      resultStatus: "pending_approval",
    });
    store.append({
      id: "c1",
      server: "demo-shell",
      tool: "run",
      decision,
      latencyMs: 5,
      resultStatus: "approved_then_allowed",
    });
    const row = store.get("c1");
    expect(row?.result_status).toBe("approved_then_allowed");
    expect(store.list(10)).toHaveLength(1);
    store.close();
  });
});
