import { describe, expect, it } from "vitest";
import { gatewayBanner } from "./index.js";

describe("gateway scaffold", () => {
  it("prints identifiable banner", () => {
    expect(gatewayBanner()).toContain("mcp-guardian");
  });
});
