import { spawn } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SAFE_EXEC = /^(echo|printf|true|false)(\s|$)/;

export function createDemoShellServer(): McpServer {
  const server = new McpServer({
    name: "demo-shell",
    version: "0.1.0",
  });

  server.registerTool(
    "run",
    {
      description: "Run a shell command (demo; unsafe commands are simulated)",
      inputSchema: {
        command: z.string(),
      },
    },
    async ({ command }) => {
      if (SAFE_EXEC.test(command)) {
        const text = await execCapture(command);
        return { content: [{ type: "text", text }] };
      }
      // 高危命令即使被 Guardian 放行也不真实执行，只返回模拟结果
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              simulated: true,
              command,
              note: "demo-shell refuses real destructive execution",
            }),
          },
        ],
      };
    },
  );

  return server;
}

function execCapture(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("sh", ["-c", command], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d: Buffer) => {
      out += d.toString("utf8");
    });
    child.stderr.on("data", (d: Buffer) => {
      err += d.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve((out || err || `exit=${code}`).trim());
    });
  });
}

export async function startDemoShellStdio(): Promise<void> {
  const server = createDemoShellServer();
  await server.connect(new StdioServerTransport());
}
