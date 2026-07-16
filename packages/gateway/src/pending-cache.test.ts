import { describe, expect, it } from "vitest";
import type { Decision } from "@mcp-guardian/shared";
import { PendingCallCache, pendingApprovalPayload } from "./pending-cache.js";

const decision: Decision = {
  action: "require_approval",
  risk: 99,
  matched_rule_id: "approve-dangerous-shell",
  reasons: ["高危 shell"],
  redacted_args: { command: "rm -rf /tmp/x" },
  mode: "fail_closed",
};

describe("pending-cache", () => {
  it("stores and takes pending calls", () => {
    const cache = new PendingCallCache();
    cache.put({
      id: "a1",
      server: "demo-shell",
      tool: "run",
      forwardArgs: { command: "rm -rf /tmp/x" },
      decision,
      createdAt: new Date().toISOString(),
    });
    expect(cache.list()).toHaveLength(1);
    expect(cache.take("a1")?.tool).toBe("run");
    expect(cache.get("a1")).toBeUndefined();
  });

  it("payload tells agent to ask user then guardian_decide", () => {
    const text = pendingApprovalPayload(
      {
        id: "x",
        server: "demo-shell",
        tool: "run",
        forwardArgs: { command: "rm -rf /" },
        decision,
        createdAt: new Date().toISOString(),
      },
      300,
    );
    expect(text).toContain("approval_required");
    expect(text).toContain("guardian_decide");
    expect(text).toContain("Ask the human user");
  });
});
