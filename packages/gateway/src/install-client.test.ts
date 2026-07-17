import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  detectRepoRoot,
  installClients,
  writeUserConfig,
} from "./install-client.js";

describe("install-client", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
    delete process.env.MCP_GUARDIAN_HOME;
  });

  it("detects monorepo root from gateway package", () => {
    const root = detectRepoRoot();
    expect(fs.existsSync(path.join(root, "pnpm-workspace.yaml"))).toBe(true);
    expect(fs.existsSync(path.join(root, "packages/gateway"))).toBe(true);
  });

  it("writes user config with absolute paths", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "mg-home-"));
    tmpDirs.push(home);
    process.env.MCP_GUARDIAN_HOME = home;
    const root = detectRepoRoot();
    const configPath = writeUserConfig(root);
    const text = fs.readFileSync(configPath, "utf8");
    expect(text).toContain(path.join(root, "policies/default.fail-closed.yaml"));
    expect(text).toContain(path.join(root, "packages/demo-servers/dist/fs.js"));
    expect(text).toContain(path.join(root, "packages/demo-servers/dist/shell-bin.js"));
    expect(text).toContain(path.join(root, "packages/demo-servers/dist/http-bin.js"));
    expect(text).toContain("demo-shell");
    expect(text).toContain("demo-http");
  });

  it("writes filesystem profile with official server package name intact", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "mg-home-"));
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), "mg-ws-"));
    tmpDirs.push(home, ws);
    process.env.MCP_GUARDIAN_HOME = home;
    const root = detectRepoRoot();
    const configPath = writeUserConfig(root, {
      profile: "filesystem",
      workspace: ws,
    });
    const text = fs.readFileSync(configPath, "utf8");
    expect(text).toContain("@modelcontextprotocol/server-filesystem");
    expect(text).toContain(path.join(root, "policies/filesystem.fail-closed.yaml"));
    expect(text).toContain(ws);
    // 回归：scoped 包名不得被 resolve 成 home 下假路径
    expect(text).not.toContain(path.join(home, "@modelcontextprotocol"));
  });

  it("filesystem profile rejects missing workspace", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "mg-home-"));
    tmpDirs.push(home);
    process.env.MCP_GUARDIAN_HOME = home;
    expect(() =>
      writeUserConfig(detectRepoRoot(), { profile: "filesystem" }),
    ).toThrow(/--workspace/);
  });

  it("merges Cursor mcp.json without dropping other servers", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "mg-home-"));
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "mg-user-"));
    tmpDirs.push(home, fakeHome);
    process.env.MCP_GUARDIAN_HOME = home;
    process.env.HOME = fakeHome;
    // 覆盖 os.homedir 不可靠时用 HOME；Node os.homedir 读 HOME
    const cursorDir = path.join(fakeHome, ".cursor");
    fs.mkdirSync(cursorDir, { recursive: true });
    fs.writeFileSync(
      path.join(cursorDir, "mcp.json"),
      JSON.stringify({ mcpServers: { other: { command: "echo" } } }, null, 2),
    );

    const result = installClients({ cursor: true, codex: false });
    const mcp = JSON.parse(
      fs.readFileSync(result.cursorPath!, "utf8"),
    ) as { mcpServers: Record<string, { command: string; args: string[] }> };
    expect(mcp.mcpServers.other.command).toBe("echo");
    expect(mcp.mcpServers["mcp-guardian"].command).toBe("node");
    expect(mcp.mcpServers["mcp-guardian"].args).toContain("start");
    expect(mcp.mcpServers["mcp-guardian"].args).toContain(result.configPath);
  });
});
