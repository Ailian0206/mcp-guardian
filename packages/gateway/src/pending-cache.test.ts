import { describe, expect, it } from "vitest";
import type { Decision } from "@mcp-guardian/shared";
import {
  PendingCallCache,
  confirmCodeOk,
  pendingApprovalPayload,
} from "./pending-cache.js";

const decision: Decision = {
  action: "require_approval",
  risk: 99,
  matched_rule_id: "approve-dangerous-shell",
  reasons: ["高危 shell"],
  redacted_args: { command: "rm -rf /tmp/x" },
  mode: "fail_closed",
};

function sampleCall(id = "a1") {
  return {
    id,
    server: "demo-shell",
    tool: "run",
    forwardArgs: { command: "rm -rf /tmp/x" },
    decision,
    createdAt: new Date().toISOString(),
    confirmCode: "abc123",
  };
}

describe("pending-cache", () => {
  it("stores and takes pending calls", () => {
    const cache = new PendingCallCache();
    cache.put(sampleCall());
    expect(cache.list()).toHaveLength(1);
    expect(cache.take("a1")?.tool).toBe("run");
    expect(cache.get("a1")).toBeUndefined();
  });

  it("payload includes confirm_code and guardian_decide instructions", () => {
    const text = pendingApprovalPayload(sampleCall("x"), 300);
    expect(text).toContain("approval_required");
    expect(text).toContain("guardian_decide");
    expect(text).toContain("confirm_code");
    expect(text).toContain("abc123");
  });

  it("allow requires matching confirm_code; deny does not", () => {
    const call = sampleCall();
    expect(confirmCodeOk(call, "allow", "abc123")).toBe(true);
    expect(confirmCodeOk(call, "allow", "wrong")).toBe(false);
    expect(confirmCodeOk(call, "allow", undefined)).toBe(false);
    expect(confirmCodeOk(call, "deny", undefined)).toBe(true);
  });
});
