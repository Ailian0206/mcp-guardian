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
import {
  PendingCallCache,
  confirmCodeOk,
  newConfirmCode,
  pendingApprovalPayload,
} from "./pending-cache.js";

function policyError(code: string, message: string): CallToolResult {
  return {
    content: [{ type: "text", text: `code=${code} ${message}` }],
    isError: true,
  };
}

function textResult(text: string, isError = false): CallToolResult {
  return { content: [{ type: "text", text }], isError };
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

const META_PENDING = "guardian_pending";
const META_DECIDE = "guardian_decide";

/**
 * 上游 stdio Server ← Guardian 策略 → 下游 MCP Client。
 * require_approval：立刻返回 pending，由 Agent 在同会话调 guardian_decide。
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
  const pending = new PendingCallCache();

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

  function findRoute(serverName: string, toolName: string): ToolRoute | undefined {
    for (const route of routes.values()) {
      if (route.serverName === serverName && route.toolName === toolName) {
        return route;
      }
    }
    return undefined;
  }

  const server = new Server(
    { name: "mcp-guardian", version: "0.2.0" },
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
    tools.push(
      {
        name: META_PENDING,
        description:
          "List MCP Guardian pending approvals waiting for the human in this Agent chat.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
      },
      {
        name: META_DECIDE,
        description:
          "After the human approves/denies in chat, resume a pending tool call. allow requires confirm_code from the approval_required payload.",
        inputSchema: {
          type: "object",
          required: ["id", "decision"],
          properties: {
            id: { type: "string", description: "approval_id from approval_required" },
            decision: { type: "string", enum: ["allow", "deny"] },
            confirm_code: {
              type: "string",
              description: "Required when decision=allow; must match approval_required.confirm_code",
            },
          },
          additionalProperties: false,
        },
      },
    );
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const started = Date.now();
    const name = request.params.name;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;

    if (name === META_PENDING) {
      const rows = approvals.listPending().map((r) => ({
        id: r.id,
        server: r.server,
        tool: r.tool,
        status: r.status,
        expires_at: r.expires_at,
        reasons: JSON.parse(r.reasons_json) as string[],
        args_redacted: JSON.parse(r.args_redacted_json) as Record<string, unknown>,
        in_memory: Boolean(pending.get(r.id)),
      }));
      return textResult(JSON.stringify({ pending: rows }, null, 2));
    }

    if (name === META_DECIDE) {
      const id = String(args.id ?? "");
      const decisionRaw = String(args.decision ?? "");
      if (!id || (decisionRaw !== "allow" && decisionRaw !== "deny")) {
        return policyError(
          ErrorCodes.DOWNSTREAM_ERROR,
          "guardian_decide requires id and decision=allow|deny",
        );
      }
      const allow = decisionRaw === "allow";
      const confirmCode =
        typeof args.confirm_code === "string" ? args.confirm_code : undefined;

      // 先校验内存上下文与确认码，再写 approvals 状态，避免错码把 pending 打成 approved
      const callPeek = pending.get(id);
      if (!callPeek) {
        return policyError(
          ErrorCodes.DOWNSTREAM_ERROR,
          "pending context missing (gateway restarted?). Re-invoke the original tool.",
        );
      }
      if (!confirmCodeOk(callPeek, allow ? "allow" : "deny", confirmCode)) {
        return policyError(
          ErrorCodes.APPROVAL_DENIED,
          "confirm_code mismatch: ask the human for the code from approval_required, then retry allow",
        );
      }

      const row = approvals.decide(id, allow);
      if (!row || (row.status !== "approved" && row.status !== "denied")) {
        return policyError(
          ErrorCodes.APPROVAL_DENIED,
          `approval not pending: ${id}`,
        );
      }
      if (!allow) {
        pending.take(id);
        audit.append({
          id,
          server: row.server,
          tool: row.tool,
          decision: {
            action: "require_approval",
            risk: 99,
            matched_rule_id: null,
            reasons: JSON.parse(row.reasons_json) as string[],
            redacted_args: JSON.parse(row.args_redacted_json) as Record<
              string,
              unknown
            >,
            mode: policy.mode,
          },
          latencyMs: Date.now() - started,
          resultStatus: "denied_by_user",
        });
        return policyError(ErrorCodes.APPROVAL_DENIED, "user denied in agent chat");
      }

      const call = pending.take(id);
      if (!call) {
        return policyError(
          ErrorCodes.DOWNSTREAM_ERROR,
          "pending context missing after decide",
        );
      }
      const route = findRoute(call.server, call.tool);
      if (!route) {
        return policyError(
          ErrorCodes.DOWNSTREAM_ERROR,
          `route missing for ${call.server}.${call.tool}`,
        );
      }
      try {
        const result = (await route.client.callTool({
          name: route.toolName,
          arguments: call.forwardArgs,
        })) as CallToolResult;
        audit.append({
          id,
          server: call.server,
          tool: call.tool,
          decision: call.decision,
          latencyMs: Date.now() - started,
          resultStatus: result.isError ? "downstream_error" : "approved_then_allowed",
        });
        return result;
      } catch (err) {
        audit.append({
          id,
          server: call.server,
          tool: call.tool,
          decision: call.decision,
          latencyMs: Date.now() - started,
          resultStatus: "downstream_exception",
        });
        return policyError(
          ErrorCodes.DOWNSTREAM_ERROR,
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    const callId = randomUUID();
    const route = routes.get(name);
    if (!route) {
      return policyError(
        ErrorCodes.DOWNSTREAM_ERROR,
        `unknown tool: ${name}`,
      );
    }

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

    const forwardArgs =
      decision.action === "redact" ? decision.redacted_args : args;

    if (decision.action === "require_approval") {
      const ttl = policy.defaults.approval_ttl_seconds ?? 300;
      approvals.create({
        id: callId,
        server: route.serverName,
        tool: route.toolName,
        argsRedacted: decision.redacted_args,
        reasons: decision.reasons,
        ttlSeconds: ttl,
      });
      const call = {
        id: callId,
        server: route.serverName,
        tool: route.toolName,
        forwardArgs: decision.redacted_args,
        decision,
        createdAt: new Date().toISOString(),
        confirmCode: newConfirmCode(),
      };
      pending.put(call);
      audit.append({
        id: callId,
        server: route.serverName,
        tool: route.toolName,
        decision,
        latencyMs: Date.now() - started,
        resultStatus: "pending_approval",
      });
      // stderr 便于本机对照；IDE 侧靠 MCP 工具确认 UI 作为外层人在环
      console.error(
        `[mcp-guardian] approval_required id=${callId} confirm_code=${call.confirmCode} — ask user, then guardian_decide`,
      );
      // 非错误返回：让 Agent 能解析并继续对话问用户
      return textResult(pendingApprovalPayload(call, ttl), false);
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
