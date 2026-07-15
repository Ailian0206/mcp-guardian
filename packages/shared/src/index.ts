import { z } from "zod";

/** 包名与仓库标识，供 CLI / Web 共用 */
export const PACKAGE_NAME = "mcp-guardian" as const;

export const POLICY_ACTIONS = [
  "allow",
  "deny",
  "redact",
  "require_approval",
] as const;

export type PolicyAction = (typeof POLICY_ACTIONS)[number];

export const PolicyModeSchema = z.enum(["fail_closed", "permissive"]);
export type PolicyMode = z.infer<typeof PolicyModeSchema>;

/** 参数匹配条件 */
export const ArgMatcherSchema = z.union([
  z.object({ eq: z.union([z.string(), z.number(), z.boolean()]) }),
  z.object({ matches: z.string() }),
  z.object({ contains: z.string() }),
  z.object({ exists: z.boolean() }),
]);
export type ArgMatcher = z.infer<typeof ArgMatcherSchema>;

export const RedactOpSchema = z.object({
  path: z.string().min(1),
  replace: z.string().optional(),
  pattern: z.string().optional(),
});
export type RedactOp = z.infer<typeof RedactOpSchema>;

export const PolicyRuleSchema = z.object({
  id: z.string().min(1),
  when: z.object({
    server: z.string().optional(),
    tool: z.string().optional(),
    args: z.record(z.string(), ArgMatcherSchema).optional(),
  }),
  action: z.enum(POLICY_ACTIONS),
  risk: z.number().min(0).max(100).default(50),
  reason: z.string().optional(),
  redact: z.array(RedactOpSchema).optional(),
});
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export const PolicyDocumentSchema = z.object({
  version: z.literal(1),
  mode: PolicyModeSchema.default("fail_closed"),
  defaults: z
    .object({
      approval_ttl_seconds: z.number().int().positive().default(300),
      risk_threshold_for_approval: z.number().min(0).max(100).default(70),
    })
    .default({
      approval_ttl_seconds: 300,
      risk_threshold_for_approval: 70,
    }),
  pre_redact: z.boolean().default(false),
  rules: z.array(PolicyRuleSchema).default([]),
});
export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;

export const ToolCallInputSchema = z.object({
  server: z.string().min(1),
  tool: z.string().min(1),
  args: z.record(z.string(), z.unknown()).default({}),
});
export type ToolCallInput = z.infer<typeof ToolCallInputSchema>;

export const DecisionSchema = z.object({
  action: z.enum(POLICY_ACTIONS),
  risk: z.number().min(0).max(100),
  matched_rule_id: z.string().nullable(),
  reasons: z.array(z.string()),
  redacted_args: z.record(z.string(), z.unknown()),
  mode: PolicyModeSchema,
});
export type Decision = z.infer<typeof DecisionSchema>;

/** 对外稳定错误码（见 architecture.md） */
export const ErrorCodes = {
  POLICY_DENIED: "POLICY_DENIED",
  APPROVAL_DENIED: "APPROVAL_DENIED",
  APPROVAL_EXPIRED: "APPROVAL_EXPIRED",
  REDACT_BLOCKED: "REDACT_BLOCKED",
  DOWNSTREAM_ERROR: "DOWNSTREAM_ERROR",
  CONFIG_INVALID: "CONFIG_INVALID",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
