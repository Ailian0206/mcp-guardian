/**
 * 真实下游冒烟：Gateway + 官方 @modelcontextprotocol/server-filesystem
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
  const workspace = process.env.MG_SMOKE_WORKSPACE;
  if (!cli || !config || !workspace) {
    throw new Error("MG_SMOKE_CLI / MG_SMOKE_CONFIG / MG_SMOKE_WORKSPACE required");
  }

  const sample = path.join(workspace, "hello.txt");
  fs.writeFileSync(sample, "real-fs-ok\n", "utf8");

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cli, "start", "--config", config],
    stderr: "pipe",
  });
  const client = new Client({ name: "real-fs-smoke", version: "0.0.0" });
  await client.connect(transport);

  try {
    const listed = await client.listTools();
    const names = listed.tools.map((t) => t.name);
    for (const n of ["read_text_file", "write_file", "guardian_decide"]) {
      if (!names.includes(n)) {
        throw new Error(`missing tool ${n}; have ${names.join(",")}`);
      }
    }
    // 单下游：不应带 filesystem__ 前缀
    if (names.some((n) => n.startsWith("filesystem__"))) {
      throw new Error("unexpected prefixed tool names for single downstream");
    }

    const allow = await client.callTool({
      name: "read_text_file",
      arguments: { path: sample },
    });
    if (isToolError(allow) || !textOf(allow).includes("real-fs-ok")) {
      throw new Error(`read failed: ${textOf(allow)}`);
    }

    const deny = await client.callTool({
      name: "write_file",
      arguments: { path: "/etc/passwd", content: "x" },
    });
    const denyText = textOf(deny);
    if (!isToolError(deny) || !denyText.includes("POLICY_DENIED")) {
      throw new Error(`system write should deny: ${denyText}`);
    }

    const target = path.join(workspace, "out.txt");
    const pending = await client.callTool({
      name: "write_file",
      arguments: { path: target, content: "approved-write\n" },
    });
    const pendingText = textOf(pending);
    if (isToolError(pending)) {
      throw new Error(`write should be approval_required: ${pendingText}`);
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
      throw new Error(`bad pending: ${pendingText}`);
    }

    const ok = await client.callTool({
      name: "guardian_decide",
      arguments: {
        id: payload.approval_id,
        decision: "allow",
        confirm_code: payload.confirm_code,
      },
    });
    if (isToolError(ok)) throw new Error(`decide allow failed: ${textOf(ok)}`);
    if (!fs.existsSync(target) || !fs.readFileSync(target, "utf8").includes("approved-write")) {
      throw new Error("file not written after approve");
    }

    console.log("REAL-FS-SMOKE OK");
  } finally {
    await client.close();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
