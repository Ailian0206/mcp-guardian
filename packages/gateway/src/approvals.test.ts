import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ApprovalStore } from "./approvals.js";

describe("ApprovalStore", () => {
  it("approves pending request", () => {
    const dbPath = path.join(
      os.tmpdir(),
      `mcp-guardian-approval-${Date.now()}.db`,
    );
    const store = new ApprovalStore(dbPath);
    store.create({
      id: "a1",
      server: "demo-shell",
      tool: "run",
      argsRedacted: { command: "rm -rf /tmp/x" },
      reasons: ["高危"],
      ttlSeconds: 60,
    });
    const decided = store.decide("a1", true);
    expect(decided?.status).toBe("approved");
    store.close();
    fs.unlinkSync(dbPath);
  });

  it("expires pending after ttl", async () => {
    const dbPath = path.join(
      os.tmpdir(),
      `mcp-guardian-approval-ttl-${Date.now()}.db`,
    );
    const store = new ApprovalStore(dbPath);
    store.create({
      id: "a2",
      server: "demo-shell",
      tool: "run",
      argsRedacted: { command: "rm -rf /tmp/x" },
      reasons: ["高危"],
      ttlSeconds: 1,
    });
    await new Promise((r) => setTimeout(r, 1100));
    const row = store.get("a2");
    expect(row?.status).toBe("expired");
    store.close();
    fs.unlinkSync(dbPath);
  });
});
