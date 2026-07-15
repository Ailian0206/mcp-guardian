import { describe, expect, it } from "vitest";
import {
  DEMO_SERVER_NAMES,
  createDemoFsServer,
  createDemoHttpServer,
  createDemoShellServer,
} from "./index.js";

describe("demo-servers", () => {
  it("lists three planned demo servers", () => {
    expect(DEMO_SERVER_NAMES).toHaveLength(3);
  });

  it("creates demo-fs MCP server instance", () => {
    expect(createDemoFsServer()).toBeTruthy();
  });

  it("creates demo-shell and demo-http servers", () => {
    expect(createDemoShellServer()).toBeTruthy();
    expect(createDemoHttpServer()).toBeTruthy();
  });
});
