/** 公开 Demo 预置审计（纯数据，不依赖 fs；可静态导出）。 */
export type PublicDemoAudit = {
  id: string;
  ts: string;
  server: string;
  tool: string;
  action: string;
  matched_rule_id: string | null;
  risk: number;
  result_status: string;
  args_redacted: Record<string, unknown>;
  reasons: string[];
  owner: string;
};

export function listPublicDemoAudits(): PublicDemoAudit[] {
  const ts = "2026-07-16T00:00:00.000Z";
  return [
    {
      id: "demo-audit-1",
      ts,
      server: "demo-fs",
      tool: "write_file",
      action: "deny",
      matched_rule_id: "deny-system-write",
      risk: 95,
      result_status: "denied",
      args_redacted: { path: "/etc/passwd", content: "***" },
      reasons: ["拒绝写入系统目录"],
      owner: "public",
    },
    {
      id: "demo-audit-2",
      ts,
      server: "demo-http",
      tool: "fetch",
      action: "redact",
      matched_rule_id: "redact-http-secrets",
      risk: 60,
      result_status: "ok",
      args_redacted: {
        url: "https://api.example.com?api_key=***REDACTED***",
        headers: { authorization: "***REDACTED***" },
      },
      reasons: ["matched rule redact-http-secrets"],
      owner: "public",
    },
    {
      id: "demo-audit-3",
      ts,
      server: "demo-shell",
      tool: "run",
      action: "require_approval",
      matched_rule_id: "approve-dangerous-shell",
      risk: 99,
      result_status: "approved_then_allowed",
      args_redacted: { command: "rm -rf /tmp/x" },
      reasons: ["高危 shell 需要人工批准"],
      owner: "public",
    },
    {
      id: "demo-audit-4",
      ts,
      server: "demo-fs",
      tool: "read_file",
      action: "allow",
      matched_rule_id: "allow-workspace-read",
      risk: 10,
      result_status: "ok",
      args_redacted: { path: "/workspace/readme.md" },
      reasons: ["允许工作区读取"],
      owner: "public",
    },
    {
      id: "demo-audit-5",
      ts,
      server: "demo-fs",
      tool: "read_file",
      action: "deny",
      matched_rule_id: null,
      risk: 100,
      result_status: "denied",
      args_redacted: { path: "/tmp/bomb-1" },
      reasons: ["no rule matched; fail_closed denies"],
      owner: "public",
    },
    {
      id: "demo-audit-6",
      ts,
      server: "demo-http",
      tool: "fetch",
      action: "redact",
      matched_rule_id: "redact-http-secrets",
      risk: 60,
      result_status: "ok",
      args_redacted: {
        url: "http://169.254.169.254/latest/meta-data/?api_key=***REDACTED***",
      },
      reasons: ["matched rule redact-http-secrets"],
      owner: "public",
    },
  ];
}

export function getPublicDemoAudit(id: string): PublicDemoAudit | undefined {
  return listPublicDemoAudits().find((a) => a.id === id);
}
