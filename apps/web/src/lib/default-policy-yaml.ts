/**
 * 与仓库 policies/default.fail-closed.yaml 对齐的内嵌策略。
 * 供浏览器内现场试跑（GitHub Pages 无 /api）与服务端 eval 共用。
 */
export const DEFAULT_FAIL_CLOSED_POLICY_YAML = `version: 1
mode: fail_closed
pre_redact: false
defaults:
  approval_ttl_seconds: 300
  risk_threshold_for_approval: 70
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
  - id: deny-system-write
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
  - id: approve-dangerous-shell
    when:
      server: demo-shell
      tool: run
      args:
        command: { matches: "(rm\\\\s+-rf|sudo|mkfs|dd\\\\s+if=)" }
    action: require_approval
    risk: 99
    reason: "高危 shell 需要人工批准"
`;
