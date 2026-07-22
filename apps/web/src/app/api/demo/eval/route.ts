import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { evaluate, loadPolicyFromYaml } from "@mcp-guardian/policy-engine";
import { DEFAULT_FAIL_CLOSED_POLICY_YAML } from "@/lib/default-policy-yaml";

function loadDefaultPolicyYaml(): string {
  // monorepo: apps/web → ../../policies/default.fail-closed.yaml
  const fromRepo = path.resolve(
    process.cwd(),
    "../../policies/default.fail-closed.yaml",
  );
  if (fs.existsSync(fromRepo)) {
    return fs.readFileSync(fromRepo, "utf8");
  }
  return DEFAULT_FAIL_CLOSED_POLICY_YAML;
}

/** 公开试跑：用真实 policy-engine 评估，供 Demo 页验收 */
export async function POST(request: Request) {
  let body: { server?: string; tool?: string; args?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const server = String(body.server ?? "");
  const tool = String(body.tool ?? "");
  const args =
    body.args && typeof body.args === "object" && !Array.isArray(body.args)
      ? body.args
      : {};
  if (!server || !tool) {
    return NextResponse.json({ error: "server/tool required" }, { status: 400 });
  }

  try {
    const policy = loadPolicyFromYaml(loadDefaultPolicyYaml());
    const decision = evaluate(policy, { server, tool, args });
    // 验收提示：redact 结果里不得出现试跑用假密钥明文
    const dumped = JSON.stringify(decision.redacted_args ?? {});
    const leaked =
      dumped.includes("sk-live-secret") || dumped.includes("Bearer sk-live");
    return NextResponse.json({
      ok: true,
      input: { server, tool, args },
      decision,
      checks: {
        secret_not_in_redacted_args: !leaked,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
