import { describe, expect, it } from "vitest";
import { DEMO_SERVER_NAMES } from "./index.js";

describe("demo-servers scaffold", () => {
  it("lists three planned demo servers", () => {
    expect(DEMO_SERVER_NAMES).toHaveLength(3);
  });
});
