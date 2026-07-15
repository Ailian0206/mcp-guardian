import { describe, expect, it } from "vitest";
import {
  PACKAGE_NAME,
  POLICY_ACTIONS,
  PolicyDocumentSchema,
  ToolCallInputSchema,
} from "./index.js";

describe("shared schemas", () => {
  it("exposes package name", () => {
    expect(PACKAGE_NAME).toBe("mcp-guardian");
  });

  it("lists four P0 policy actions", () => {
    expect(POLICY_ACTIONS).toEqual([
      "allow",
      "deny",
      "redact",
      "require_approval",
    ]);
  });

  it("parses minimal policy document with defaults", () => {
    const doc = PolicyDocumentSchema.parse({ version: 1 });
    expect(doc.mode).toBe("fail_closed");
    expect(doc.rules).toEqual([]);
    expect(doc.defaults.approval_ttl_seconds).toBe(300);
  });

  it("rejects unsupported policy version", () => {
    expect(() => PolicyDocumentSchema.parse({ version: 2 })).toThrow();
  });

  it("parses tool call input with empty args default", () => {
    const call = ToolCallInputSchema.parse({
      server: "demo-fs",
      tool: "read_file",
    });
    expect(call.args).toEqual({});
  });
});
