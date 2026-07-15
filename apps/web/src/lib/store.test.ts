import { describe, expect, it } from "vitest";
import { computeActionStats, validatePolicyYaml } from "./store.js";

describe("web store", () => {
  it("accepts valid policy yaml", () => {
    const result = validatePolicyYaml(`version: 1\nrules: []\n`);
    expect(result.ok).toBe(true);
  });

  it("rejects invalid policy action", () => {
    const result = validatePolicyYaml(`
version: 1
rules:
  - id: bad
    when: {}
    action: explode
`);
    expect(result.ok).toBe(false);
  });

  it("aggregates action stats", () => {
    const stats = computeActionStats([
      { action: "allow" },
      { action: "deny" },
      { action: "deny" },
      { action: "redact" },
      { action: "require_approval" },
    ] as never);
    expect(stats).toEqual({
      allow: 1,
      deny: 2,
      redact: 1,
      require_approval: 1,
      total: 5,
    });
  });
});
