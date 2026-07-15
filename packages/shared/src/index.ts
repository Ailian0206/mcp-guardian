/** 包名与仓库标识，供 CLI / Web 共用 */
export const PACKAGE_NAME = "mcp-guardian" as const;

export const POLICY_ACTIONS = [
  "allow",
  "deny",
  "redact",
  "require_approval",
] as const;

export type PolicyAction = (typeof POLICY_ACTIONS)[number];
