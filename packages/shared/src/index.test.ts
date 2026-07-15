import { describe, expect, it } from "vitest";
import { PACKAGE_NAME, POLICY_ACTIONS } from "./index.js";

describe("shared scaffold", () => {
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
});
