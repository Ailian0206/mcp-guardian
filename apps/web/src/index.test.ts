import { describe, expect, it } from "vitest";
import { webAppTitle } from "./index.js";

describe("web scaffold", () => {
  it("exposes dashboard title", () => {
    expect(webAppTitle()).toContain("dashboard");
  });
});
