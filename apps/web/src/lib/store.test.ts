import { describe, expect, it } from "vitest";
import { validatePolicyYaml } from "./store.js";

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
});
