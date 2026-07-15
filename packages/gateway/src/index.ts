import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { evaluate, loadPolicyFromYaml } from "@mcp-guardian/policy-engine";
import { ErrorCodes, type PolicyDocument } from "@mcp-guardian/shared";
import { AuditStore } from "./audit.js";
import {
  loadGuardianConfig,
  resolveFromConfigDir,
  type DownstreamConfig,
} from "./config.js";

function policyError(code: string, message: string): CallToolResult {
  return {
    content: [{ type: "text", text: `code=${code} ${message}` }],
    isError: true,
  };
}

function cleanEnv(
  extra?: Record<string, string>,
): Record<string, string> | undefined {
  if (!extra) return undefined;
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === "string") base[k] = v;
  }
  return { ...base, ...extra };
}

async function connectDownstream(ds: DownstreamConfig): Promise<Client> {
  const env = cleanEnv(ds.env);
  const transport = new StdioClientTransport({
    command: ds.command,
    args: ds.args,
    stderr: "pipe",
    ...(ds.cwd ? { cwd: ds.cwd } : {}),
    ...(env ? { env } : {}),
  });
  const client = new Client({ name: "mcp-guardian", version: "0.1.0" });
  await client.connect(transport);
  return client;
}

type ToolRoute = { serverName: string; toolName: string; client: Client };

/**
 * 上游 stdio Server ← Guardian 策略 → 下游 MCP Client。
 * Week 1：require_approval 记审计后拒绝（完整审批 Week 2）。
 */
export async function startProxy(options: {
  configPath: string;
}): Promise<{ close: () => Promise<void> }> {
  const config = loadGuardianConfig(options.configPath);
  const policyPath = resolveFromConfigDir(options.configPath, config.policyFile);
  let policy: PolicyDocument = loadPolicyFromYaml(
    readFileSync(policyPath, "utf8"),
  );
  if (config.mode) {
    policy = { ...policy, mode: config.mode };
  }

  const auditDb = config.auditDb
    ? resolveFromConfigDir(options.configPath, config.auditDb)
    : undefined;
  const audit = new AuditStore(auditDb);

  const clients = new Map<string, Client>();
  const routes = new Map<string, ToolRoute>();

  for (const ds of config.downstreams) {
    const resolved: DownstreamConfig = {
      name: ds.name,
      command: ds.command,
      args: ds.args.map((a) =>
        a.startsWith(".") || a.includes("/") || a.endsWith(".js")
          ? resolveFromConfigDir(options.configPath, a)
          : a,
      ),
      ...(ds.cwd
        ? { cwd: resolveFromConfigDir(options.configPath, ds.cwd) }
        : { cwd: resolveFromConfigDir(options.configPath, ".") }),
      ...(ds.env ? { env: ds.env } : {}),
    };
    const client = await connectDownstream(resolved);
    clients.set(ds.name, client);

    const listed = await client.listTools();
    for (const tool of listed.tools) {
      const exposed =
        config.downstreams.length === 1
          ? tool.name
          : `${ds.name}__${tool.name}`;
      routes.set(exposed, {
        serverName: ds.name,
        toolName: tool.name,
        client,
      });
    }
  }

  const server = new Server(
    { name: "mcp-guardian", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [];
    for (const [exposed, route] of routes) {
      const listed = await route.client.listTools();
      const original = listed.tools.find((t) => t.name === route.toolName);
      tools.push({
        name: exposed,
        description: `[via ${route.serverName}] ${original?.description ?? route.toolName}`,
        inputSchema: original?.inputSchema ?? {
          type: "object",
          additionalProperties: true,
        },
      });
    }
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const started = Date.now();
    const callId = randomUUID();
    const route = routes.get(request.params.name);
    if (!route) {
      return policyError(
        ErrorCodes.DOWNSTREAM_ERROR,
        `unknown tool: ${request.params.name}`,
      );
    }

    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    const decision = evaluate(policy, {
      server: route.serverName,
      tool: route.toolName,
      args,
    });

    if (decision.action === "deny") {
      audit.append({
        id: callId,
        server: route.serverName,
        tool: route.toolName,
        decision,
        latencyMs: Date.now() - started,
        resultStatus: "denied",
      });
      return policyError(ErrorCodes.POLICY_DENIED, decision.reasons.join("; "));
    }

    if (decision.action === "require_approval") {
      audit.append({
        id: callId,
        server: route.serverName,
        tool: route.toolName,
        decision,
        latencyMs: Date.now() - started,
        resultStatus: "approval_required_stub",
      });
      return policyError(
        ErrorCodes.POLICY_DENIED,
        `require_approval pending (Week 2): ${decision.reasons.join("; ")}`,
      );
    }

    const forwardArgs =
      decision.action === "redact" ? decision.redacted_args : args;

    try {
      const result = (await route.client.callTool({
        name: route.toolName,
        arguments: forwardArgs,
      })) as CallToolResult;
      audit.append({
        id: callId,
        server: route.serverName,
        tool: route.toolName,
        decision,
        latencyMs: Date.now() - started,
        resultStatus: result.isError ? "downstream_error" : "ok",
      });
      return result;
    } catch (err) {
      audit.append({
        id: callId,
        server: route.serverName,
        tool: route.toolName,
        decision,
        latencyMs: Date.now() - started,
        resultStatus: "downstream_exception",
      });
      return policyError(
        ErrorCodes.DOWNSTREAM_ERROR,
        err instanceof Error ? err.message : String(err),
      );
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  return {
    close: async () => {
      audit.close();
      await Promise.all([...clients.values()].map((c) => c.close()));
      await server.close();
    },
  };
}

export function evalToolCall(options: {
  policyFile: string;
  server: string;
  tool: string;
  argsJson: string;
}): ReturnType<typeof evaluate> {
  const policy = loadPolicyFromYaml(readFileSync(options.policyFile, "utf8"));
  const args = JSON.parse(options.argsJson) as Record<string, unknown>;
  return evaluate(policy, {
    server: options.server,
    tool: options.tool,
    args,
  });
}
