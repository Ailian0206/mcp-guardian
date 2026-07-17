/**
 * IDE 主路径冒烟（由 scenarios/ide-smoke.sh 调用）。
 * 以 MCP Client 连 Gateway stdio，覆盖 allow/deny/redact/confirm_code。
 */
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

function textOf(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const content = (result as { content?: Array<{ type?: string; text?: string }> })
    .content;
  return (content ?? [])
    .map((p) => (p.type === "text" ? (p.text ?? "") : ""))
    .join("\n");
}

function isToolError(result: unknown): boolean {
  return Boolean(
    result && typeof result === "object" && (result as { isError?: boolean }).isError,
  );
}

async function main(): Promise<void> {
  const cli = process.env.MG_SMOKE_CLI;
  const config = process.env.MG_SMOKE_CONFIG;
  if (!cli || !config) {
    throw new Error("MG_SMOKE_CLI / MG_SMOKE_CONFIG required");
  }

  // demo-fs 默认落在 config 同目录下的 .mcp-guardian-demo-fs（cwd=configDir）
  const demoFsRoot = path.join(path.dirname(config), ".mcp-guardian-demo-fs");
  fs.mkdirSync(demoFsRoot, { recursive: true });
  fs.writeFileSync(path.join(demoFsRoot, "readme.md"), "hello-guardian\n", "utf8");

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cli, "start", "--config", config],
    stderr: "pipe",
  });
  const client = new Client({ name: "ide-smoke", version: "0.0.0" });
  await client.connect(transport);

  try {
    const listed = await client.listTools();
    const names = listed.tools.map((t) => t.name);
    const need = [
      "demo-fs__read_file",
      "demo-fs__write_file",
      "demo-shell__run",
      "demo-http__fetch",
      "guardian_decide",
      "guardian_pending",
    ];
    for (const n of need) {
      if (!names.includes(n)) {
        throw new Error(`missing tool ${n}; have ${names.join(",")}`);
      }
    }

    const allow = await client.callTool({
      name: "demo-fs__read_file",
      arguments: { path: "/workspace/readme.md" },
    });
    if (isToolError(allow) || !textOf(allow).includes("hello-guardian")) {
      throw new Error(`A1 allow failed: ${textOf(allow)}`);
    }

    const deny = await client.callTool({
      name: "demo-fs__write_file",
      arguments: { path: "/etc/passwd", content: "x" },
    });
    const denyText = textOf(deny);
    if (
      !isToolError(deny) ||
      (!denyText.includes("POLICY_DENIED") && !denyText.includes("拒绝写入"))
    ) {
      throw new Error(`A2 deny unexpected: ${denyText}`);
    }

    const redact = await client.callTool({
      name: "demo-http__fetch",
      arguments: {
        url: "https://api.example.com?api_key=sk-live-secret",
        headers: { authorization: "Bearer sk-live-secret" },
      },
    });
    const redactText = textOf(redact);
    if (redactText.includes("sk-live-secret")) {
      throw new Error(`A3 leaked secret: ${redactText}`);
    }
    if (!redactText.includes("REDACTED")) {
      throw new Error(`A3 expected REDACTED: ${redactText.slice(0, 500)}`);
    }

    const pending = await client.callTool({
      name: "demo-shell__run",
      arguments: { command: "rm -rf /tmp/x" },
    });
    const pendingText = textOf(pending);
    if (isToolError(pending)) {
      throw new Error(`A4 pending should not be error: ${pendingText}`);
    }
    const payload = JSON.parse(pendingText) as {
      status: string;
      confirm_code?: string;
      approval_id?: string;
    };
    if (
      payload.status !== "approval_required" ||
      !payload.confirm_code ||
      !payload.approval_id
    ) {
      throw new Error(`A4 bad payload: ${pendingText}`);
    }

    const bad = await client.callTool({
      name: "guardian_decide",
      arguments: {
        id: payload.approval_id,
        decision: "allow",
        confirm_code: "000000",
      },
    });
    if (!isToolError(bad) || !textOf(bad).includes("confirm_code")) {
      throw new Error(`wrong confirm_code should fail: ${textOf(bad)}`);
    }

    const ok = await client.callTool({
      name: "guardian_decide",
      arguments: {
        id: payload.approval_id,
        decision: "allow",
        confirm_code: payload.confirm_code,
      },
    });
    if (isToolError(ok)) throw new Error(`A5 allow failed: ${textOf(ok)}`);

    console.log("IDE-SMOKE OK");
  } finally {
    await client.close();
    fs.rmSync(demoFsRoot, { recursive: true, force: true });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
