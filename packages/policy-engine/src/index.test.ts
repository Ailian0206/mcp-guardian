import { describe, expect, it } from "vitest";
import {
  applyRedactions,
  evaluate,
  loadPolicyFromYaml,
} from "./index.js";

const baseYaml = `
version: 1
mode: fail_closed
pre_redact: false
rules:
  - id: allow-workspace-read
    when:
      server: demo-fs
      tool: read_file
      args:
        path: { matches: "^/workspace/" }
    action: allow
    risk: 10
    reason: "允许工作区读取"
  - id: deny-etc-write
    when:
      server: demo-fs
      tool: write_file
      args:
        path: { matches: "^/(etc|var|usr)/" }
    action: deny
    risk: 95
    reason: "拒绝写入系统目录"
  - id: redact-http-secrets
    when:
      server: demo-http
      tool: fetch
    action: redact
    risk: 60
    redact:
      - path: headers.authorization
        replace: "***REDACTED***"
      - path: url
        pattern: "(api_key|token|secret)=([^&]+)"
        replace: "$1=***REDACTED***"
  - id: approve-rm
    when:
      server: demo-shell
      tool: run
      args:
        command: { matches: "rm\\\\s+-rf" }
    action: require_approval
    risk: 99
    reason: "高危 shell"
`;

describe("policy-engine evaluate", () => {
  const policy = loadPolicyFromYaml(baseYaml);

  it("allows workspace read (A1)", () => {
    const d = evaluate(policy, {
      server: "demo-fs",
      tool: "read_file",
      args: { path: "/workspace/a.txt" },
    });
    expect(d.action).toBe("allow");
    expect(d.matched_rule_id).toBe("allow-workspace-read");
    expect(d.risk).toBe(10);
  });

  it("denies etc write (A2)", () => {
    const d = evaluate(policy, {
      server: "demo-fs",
      tool: "write_file",
      args: { path: "/etc/passwd" },
    });
    expect(d.action).toBe("deny");
    expect(d.matched_rule_id).toBe("deny-etc-write");
  });

  it("fail_closed denies unmatched calls", () => {
    const d = evaluate(policy, {
      server: "demo-fs",
      tool: "read_file",
      args: { path: "/tmp/x" },
    });
    expect(d.action).toBe("deny");
    expect(d.matched_rule_id).toBeNull();
    expect(d.reasons[0]).toContain("fail_closed");
  });

  it("permissive allows unmatched calls", () => {
    const permissive = loadPolicyFromYaml(`
version: 1
mode: permissive
rules: []
`);
    const d = evaluate(permissive, {
      server: "any",
      tool: "any",
      args: {},
    });
    expect(d.action).toBe("allow");
    expect(d.mode).toBe("permissive");
  });

  it("first match wins over later rules", () => {
    const doc = loadPolicyFromYaml(`
version: 1
mode: fail_closed
rules:
  - id: first-allow
    when: { server: s, tool: t }
    action: allow
    risk: 1
  - id: second-deny
    when: { server: s, tool: t }
    action: deny
    risk: 99
`);
    expect(evaluate(doc, { server: "s", tool: "t", args: {} }).matched_rule_id).toBe(
      "first-allow",
    );
  });

  it("matches server glob", () => {
    const doc = loadPolicyFromYaml(`
version: 1
rules:
  - id: star-server
    when: { server: "demo-*", tool: read_file }
    action: allow
    risk: 5
`);
    expect(
      evaluate(doc, {
        server: "demo-fs",
        tool: "read_file",
        args: {},
      }).action,
    ).toBe("allow");
  });

  it("matches tool glob", () => {
    const doc = loadPolicyFromYaml(`
version: 1
rules:
  - id: star-tool
    when: { server: demo-fs, tool: "read_*" }
    action: allow
    risk: 5
`);
    expect(
      evaluate(doc, {
        server: "demo-fs",
        tool: "read_file",
        args: {},
      }).matched_rule_id,
    ).toBe("star-tool");
  });

  it("matches args.eq", () => {
    const doc = loadPolicyFromYaml(`
version: 1
rules:
  - id: eq
    when:
      server: s
      tool: t
      args: { mode: { eq: "ro" } }
    action: allow
    risk: 1
`);
    expect(
      evaluate(doc, { server: "s", tool: "t", args: { mode: "ro" } }).action,
    ).toBe("allow");
    expect(
      evaluate(doc, { server: "s", tool: "t", args: { mode: "rw" } }).action,
    ).toBe("deny");
  });

  it("matches args.contains", () => {
    const doc = loadPolicyFromYaml(`
version: 1
rules:
  - id: contains
    when:
      server: s
      tool: t
      args: { command: { contains: "sudo" } }
    action: deny
    risk: 90
`);
    expect(
      evaluate(doc, {
        server: "s",
        tool: "t",
        args: { command: "sudo ls" },
      }).action,
    ).toBe("deny");
  });

  it("matches args.exists true/false", () => {
    const doc = loadPolicyFromYaml(`
version: 1
rules:
  - id: must-have-token
    when:
      server: s
      tool: t
      args: { token: { exists: true } }
    action: require_approval
    risk: 80
`);
    expect(
      evaluate(doc, { server: "s", tool: "t", args: { token: "x" } }).action,
    ).toBe("require_approval");
    expect(evaluate(doc, { server: "s", tool: "t", args: {} }).action).toBe(
      "deny",
    );
  });

  it("redacts authorization header (A3 path)", () => {
    const d = evaluate(policy, {
      server: "demo-http",
      tool: "fetch",
      args: {
        url: "https://api.example.com?api_key=sk-live-secret",
        headers: { authorization: "Bearer sk-live-secret" },
      },
    });
    expect(d.action).toBe("redact");
    expect(d.redacted_args.headers).toEqual({
      authorization: "***REDACTED***",
    });
    expect(String(d.redacted_args.url)).toContain("api_key=***REDACTED***");
    expect(String(d.redacted_args.url)).not.toContain("sk-live-secret");
  });

  it("requires approval for rm -rf (A4)", () => {
    const d = evaluate(policy, {
      server: "demo-shell",
      tool: "run",
      args: { command: "rm -rf /tmp/x" },
    });
    expect(d.action).toBe("require_approval");
    expect(d.matched_rule_id).toBe("approve-rm");
  });

  it("includes reasons for matched rule", () => {
    const d = evaluate(policy, {
      server: "demo-fs",
      tool: "read_file",
      args: { path: "/workspace/a.txt" },
    });
    expect(d.reasons.some((r) => r.includes("允许工作区读取"))).toBe(true);
  });

  it("pre_redact runs before matching when enabled", () => {
    const doc = loadPolicyFromYaml(`
version: 1
pre_redact: true
rules:
  - id: after-redact
    when:
      server: demo-http
      tool: fetch
    action: allow
    risk: 20
`);
    const d = evaluate(doc, {
      server: "demo-http",
      tool: "fetch",
      args: {
        url: "https://x?api_key=abc",
        headers: { authorization: "Bearer abc" },
      },
    });
    expect(d.action).toBe("allow");
    expect(String(d.redacted_args.url)).toContain("***REDACTED***");
  });

  it("applyRedactions replaces nested path", () => {
    const out = applyRedactions(
      { headers: { authorization: "Bearer x" } },
      [{ path: "headers.authorization", replace: "gone" }],
    );
    expect(out).toEqual({ headers: { authorization: "gone" } });
  });

  it("applyRedactions pattern rewrite", () => {
    const out = applyRedactions(
      { url: "https://x?token=abc&ok=1" },
      [
        {
          path: "url",
          pattern: "(token)=([^&]+)",
          replace: "$1=***",
        },
      ],
    );
    expect(out.url).toBe("https://x?token=***&ok=1");
  });

  it("rejects invalid yaml policy schema", () => {
    expect(() =>
      loadPolicyFromYaml(`
version: 1
rules:
  - id: bad
    when: {}
    action: explode
`),
    ).toThrow();
  });

  it("loads empty rules document", () => {
    const doc = loadPolicyFromYaml(`version: 1\nrules: []\n`);
    expect(doc.mode).toBe("fail_closed");
  });

  it("does not mutate original args object", () => {
    const args = {
      url: "https://x?api_key=secret",
      headers: { authorization: "Bearer secret" },
    };
    evaluate(policy, { server: "demo-http", tool: "fetch", args });
    expect(args.headers.authorization).toBe("Bearer secret");
  });

  it("nested arg path matching", () => {
    const doc = loadPolicyFromYaml(`
version: 1
rules:
  - id: nested
    when:
      server: s
      tool: t
      args:
        meta.env: { eq: "prod" }
    action: deny
    risk: 70
`);
    expect(
      evaluate(doc, {
        server: "s",
        tool: "t",
        args: { meta: { env: "prod" } },
      }).action,
    ).toBe("deny");
  });

  it("var path write denied like etc", () => {
    const d = evaluate(policy, {
      server: "demo-fs",
      tool: "write_file",
      args: { path: "/var/log/x" },
    });
    expect(d.action).toBe("deny");
  });
});
