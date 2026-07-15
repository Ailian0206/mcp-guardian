import { describe, expect, it } from "vitest";
import { DEMO_SERVER_NAMES, createDemoFsServer } from "./index.js";

describe("demo-servers", () => {
  it("lists three planned demo servers", () => {
    expect(DEMO_SERVER_NAMES).toHaveLength(3);
  });

  it("creates demo-fs MCP server instance", () => {
    const server = createDemoFsServer();
    expect(server).toBeTruthy();
  });
});
