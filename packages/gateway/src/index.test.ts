import { describe, expect, it } from "vitest";
import { evalToolCall } from "./index.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const policyFile = path.join(root, "policies/default.fail-closed.yaml");

describe("gateway eval", () => {
  it("allows workspace read via eval helper", () => {
    const d = evalToolCall({
      policyFile,
      server: "demo-fs",
      tool: "read_file",
      argsJson: JSON.stringify({ path: "/workspace/a.txt" }),
    });
    expect(d.action).toBe("allow");
  });

  it("denies etc write via eval helper", () => {
    const d = evalToolCall({
      policyFile,
      server: "demo-fs",
      tool: "write_file",
      argsJson: JSON.stringify({ path: "/etc/passwd", content: "x" }),
    });
    expect(d.action).toBe("deny");
  });
});
