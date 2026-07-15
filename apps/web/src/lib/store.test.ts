import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { computeActionStats, seedDemoFixtures, validatePolicyYaml } from "./store.js";

describe("web store", () => {
  const prevData = process.env.MCP_GUARDIAN_WEB_DATA;
  let tempDir: string | undefined;

  afterEach(() => {
    if (prevData === undefined) delete process.env.MCP_GUARDIAN_WEB_DATA;
    else process.env.MCP_GUARDIAN_WEB_DATA = prevData;
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  });

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

  it("seedDemoFixtures does not rewrite when fixtures already complete", () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mg-seed-"));
    process.env.MCP_GUARDIAN_WEB_DATA = tempDir;
    seedDemoFixtures();
    const file = path.join(tempDir, "store.json");
    const before = fs.readFileSync(file, "utf8");
    const mtime1 = fs.statSync(file).mtimeMs;
    // 稍等以确保若误写盘 mtime 会变化
    const start = Date.now();
    while (Date.now() - start < 25) {
      /* spin */
    }
    seedDemoFixtures();
    expect(fs.statSync(file).mtimeMs).toBe(mtime1);
    expect(fs.readFileSync(file, "utf8")).toBe(before);
  });
});
