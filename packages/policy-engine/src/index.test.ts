import { describe, expect, it } from "vitest";
import { scaffoldAction } from "./index.js";

describe("policy-engine scaffold", () => {
  it("defaults to fail-closed deny placeholder", () => {
    expect(scaffoldAction()).toBe("deny");
  });
});
