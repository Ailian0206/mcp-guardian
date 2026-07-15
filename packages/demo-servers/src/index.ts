import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/** 演示用文件系统根目录，避免误伤真实系统路径 */
function workspaceRoot(): string {
  const root = process.env.MCP_GUARDIAN_DEMO_FS_ROOT;
  if (root) return path.resolve(root);
  return path.resolve(process.cwd(), ".mcp-guardian-demo-fs");
}

function resolveSafe(relOrAbs: string): string {
  const root = workspaceRoot();
  mkdirSync(root, { recursive: true });
  // 策略层用 /workspace/...；物理落在 demo root 下
  const normalized = relOrAbs.replace(/^\/workspace\/?/, "");
  const full = path.resolve(root, normalized);
  if (!full.startsWith(root)) {
    throw new Error("path escapes workspace");
  }
  return full;
}

export function createDemoFsServer(): McpServer {
  const server = new McpServer({
    name: "demo-fs",
    version: "0.1.0",
  });

  server.registerTool(
    "read_file",
    {
      description: "Read a text file under /workspace",
      inputSchema: {
        path: z.string().describe("Absolute path starting with /workspace/"),
      },
    },
    async ({ path: filePath }) => {
      const full = resolveSafe(filePath);
      if (!existsSync(full)) {
        return {
          content: [{ type: "text", text: `not found: ${filePath}` }],
          isError: true,
        };
      }
      const text = readFileSync(full, "utf8");
      return { content: [{ type: "text", text }] };
    },
  );

  server.registerTool(
    "write_file",
    {
      description: "Write a text file under /workspace",
      inputSchema: {
        path: z.string(),
        content: z.string(),
      },
    },
    async ({ path: filePath, content }) => {
      // 真实系统路径写入由 Guardian 策略拦截；此处仍拒绝逃逸
      if (filePath.startsWith("/etc/") || filePath.startsWith("/var/") || filePath.startsWith("/usr/")) {
        return {
          content: [
            {
              type: "text",
              text: `refused local write to system path: ${filePath}`,
            },
          ],
          isError: true,
        };
      }
      const full = resolveSafe(filePath);
      mkdirSync(path.dirname(full), { recursive: true });
      writeFileSync(full, content, "utf8");
      return {
        content: [{ type: "text", text: `wrote ${filePath} (${content.length} bytes)` }],
      };
    },
  );

  return server;
}

export async function startDemoFsStdio(): Promise<void> {
  const server = createDemoFsServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export { createDemoShellServer, startDemoShellStdio } from "./shell.js";
export { createDemoHttpServer, startDemoHttpStdio } from "./http.js";

export const DEMO_SERVER_NAMES = ["demo-fs", "demo-shell", "demo-http"] as const;
export type DemoServerName = (typeof DEMO_SERVER_NAMES)[number];
