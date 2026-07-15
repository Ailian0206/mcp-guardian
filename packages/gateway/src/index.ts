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
import { ApprovalStore } from "./approvals.js";
import { AuditStore } from "./audit.js";
import {
  loadGuardianConfig,
  resolveFromConfigDir,
  type DownstreamConfig,
} from "./config.js";
import { registerDevice, SyncClient } from "./sync.js";

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
 * require_approval：写入 pending，阻塞等待 CLI `approvals decide`。
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
  const approvals = new ApprovalStore(auditDb);

  let syncClient: SyncClient | null = null;
  if (config.sync?.enabled && config.sync.endpoint) {
    const token =
      config.sync.deviceToken ??
      (await registerDevice(config.sync.endpoint, config.sync.owner));
    syncClient = new SyncClient({
      endpoint: config.sync.endpoint,
      deviceToken: token,
    });
    console.error(`[mcp-guardian] sync enabled endpoint=${config.sync.endpoint}`);
  }

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

    let forwardArgs =
      decision.action === "redact" ? decision.redacted_args : args;

    if (decision.action === "require_approval") {
      const ttl =
        policy.defaults.approval_ttl_seconds ?? 300;
      approvals.create({
        id: callId,
        server: route.serverName,
        tool: route.toolName,
        argsRedacted: decision.redacted_args,
        reasons: decision.reasons,
        ttlSeconds: ttl,
      });
      // stderr 提示操作者，避免污染 MCP stdio
      console.error(
        `[mcp-guardian] approval required id=${callId} server=${route.serverName} tool=${route.toolName}`,
      );
      console.error(
        `[mcp-guardian] decide: mcp-guardian approvals decide ${callId} --allow`,
      );

      if (syncClient) {
        await syncClient.pushAndPull({
          approvals: [
            {
              id: callId,
              status: "pending",
              server: route.serverName,
              tool: route.toolName,
              args_redacted: decision.redacted_args,
              reasons: decision.reasons,
              created_at: new Date().toISOString(),
              decided_at: null,
            },
          ],
        });
      }

      const decided = await waitForApproval(approvals, callId, syncClient);
      if (decided.status === "denied") {
        audit.append({
          id: callId,
          server: route.serverName,
          tool: route.toolName,
          decision,
          latencyMs: Date.now() - started,
          resultStatus: "denied_by_user",
        });
        return policyError(
          ErrorCodes.APPROVAL_DENIED,
          decision.reasons.join("; "),
        );
      }
      if (decided.status === "expired") {
        audit.append({
          id: callId,
          server: route.serverName,
          tool: route.toolName,
          decision,
          latencyMs: Date.now() - started,
          resultStatus: "approval_expired",
        });
        return policyError(
          ErrorCodes.APPROVAL_EXPIRED,
          `approval timed out after ${ttl}s`,
        );
      }
      // approved → 继续转发（参数仍用脱敏视图）
      forwardArgs = decision.redacted_args;
    }

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
        resultStatus:
          decision.action === "require_approval"
            ? "approved_then_allowed"
            : result.isError
              ? "downstream_error"
              : "ok",
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
      approvals.close();
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

/** 本地 CLI 批准与 Web Dashboard 批准均可结束等待 */
async function waitForApproval(
  store: ApprovalStore,
  id: string,
  syncClient: SyncClient | null,
) {
  for (;;) {
    if (syncClient) {
      try {
        const remote = await syncClient.pushAndPull({});
        const hit = remote.decided.find((d) => d.id === id);
        if (hit?.status === "approved" || hit?.status === "denied") {
          store.decide(id, hit.status === "approved");
        }
      } catch (err) {
        console.error(
          `[mcp-guardian] sync poll failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    const row = store.get(id);
    if (!row) throw new Error(`approval not found: ${id}`);
    if (row.status !== "pending") return row;
    await new Promise((r) => setTimeout(r, 400));
  }
}
