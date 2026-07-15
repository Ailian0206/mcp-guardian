import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export function createDemoHttpServer(): McpServer {
  const server = new McpServer({
    name: "demo-http",
    version: "0.1.0",
  });

  server.registerTool(
    "fetch",
    {
      description: "Demo HTTP fetch; returns echoed request (no real network)",
      inputSchema: {
        url: z.string(),
        headers: z.record(z.string(), z.string()).optional(),
      },
    },
    async ({ url, headers }) => {
      // 不发起真实外网请求；回显参数以便验证 Guardian 脱敏
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ok: true,
                echoed: {
                  url,
                  headers: headers ?? {},
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  return server;
}

export async function startDemoHttpStdio(): Promise<void> {
  const server = createDemoHttpServer();
  await server.connect(new StdioServerTransport());
}
