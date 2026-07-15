import type {
  ArgMatcher,
  Decision,
  PolicyDocument,
  PolicyRule,
  RedactOp,
  ToolCallInput,
} from "@mcp-guardian/shared";
import { PolicyDocumentSchema } from "@mcp-guardian/shared";
import { parse as parseYaml } from "yaml";

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function setByPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split(".");
  const clone = structuredClone(obj);
  let cur: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (!key) continue;
    const next = cur[key];
    if (next === null || next === undefined || typeof next !== "object") {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (last) cur[last] = value;
  return clone;
}

function matchGlob(pattern: string, value: string): boolean {
  if (pattern === "*" || pattern === value) return true;
  // 简易 glob：仅支持 * 通配片段
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(value);
}

function matchArg(actual: unknown, matcher: ArgMatcher): boolean {
  if ("exists" in matcher) {
    const exists = actual !== undefined && actual !== null;
    return matcher.exists ? exists : !exists;
  }
  if ("eq" in matcher) {
    return actual === matcher.eq;
  }
  if (typeof actual !== "string") return false;
  if ("contains" in matcher) {
    return actual.includes(matcher.contains);
  }
  if ("matches" in matcher) {
    return new RegExp(matcher.matches).test(actual);
  }
  return false;
}

function ruleMatches(rule: PolicyRule, input: ToolCallInput): boolean {
  const { when } = rule;
  if (when.server && !matchGlob(when.server, input.server)) return false;
  if (when.tool && !matchGlob(when.tool, input.tool)) return false;
  if (when.args) {
    for (const [path, matcher] of Object.entries(when.args)) {
      const actual = getByPath(input.args, path);
      if (!matchArg(actual, matcher)) return false;
    }
  }
  return true;
}

/** 按路径/正则执行脱敏改写 */
export function applyRedactions(
  args: Record<string, unknown>,
  ops: RedactOp[],
): Record<string, unknown> {
  let next = structuredClone(args);
  for (const op of ops) {
    const current = getByPath(next, op.path);
    if (typeof current !== "string") {
      if (op.replace !== undefined) {
        next = setByPath(next, op.path, op.replace);
      }
      continue;
    }
    if (op.pattern) {
      next = setByPath(
        next,
        op.path,
        current.replace(new RegExp(op.pattern, "g"), op.replace ?? "***REDACTED***"),
      );
    } else if (op.replace !== undefined) {
      next = setByPath(next, op.path, op.replace);
    } else {
      next = setByPath(next, op.path, "***REDACTED***");
    }
  }
  return next;
}

const BUILTIN_SECRET_OPS: RedactOp[] = [
  {
    path: "headers.authorization",
    replace: "***REDACTED***",
  },
  {
    path: "url",
    pattern: "(api[_-]?key|token|secret)=([^&]+)",
    replace: "$1=***REDACTED***",
  },
];

export function loadPolicyFromYaml(text: string): PolicyDocument {
  const raw = parseYaml(text);
  return PolicyDocumentSchema.parse(raw);
}

/**
 * 同步策略评估：first-match wins；未命中按 mode 决定 allow/deny。
 */
export function evaluate(
  policy: PolicyDocument,
  input: ToolCallInput,
): Decision {
  let args = structuredClone(input.args);

  if (policy.pre_redact) {
    args = applyRedactions(args, BUILTIN_SECRET_OPS);
  }

  for (const rule of policy.rules) {
    if (!ruleMatches(rule, { ...input, args })) continue;

    let redactedArgs = args;
    if (rule.redact && rule.redact.length > 0) {
      redactedArgs = applyRedactions(args, rule.redact);
    } else if (rule.action === "redact") {
      redactedArgs = applyRedactions(args, BUILTIN_SECRET_OPS);
    }

    const reasons = [
      rule.reason ?? `matched rule ${rule.id}`,
      `action=${rule.action}`,
    ];

    return {
      action: rule.action,
      risk: rule.risk,
      matched_rule_id: rule.id,
      reasons,
      redacted_args: redactedArgs,
      mode: policy.mode,
    };
  }

  if (policy.mode === "permissive") {
    return {
      action: "allow",
      risk: 0,
      matched_rule_id: null,
      reasons: ["no rule matched; permissive mode allows"],
      redacted_args: args,
      mode: policy.mode,
    };
  }

  return {
    action: "deny",
    risk: 100,
    matched_rule_id: null,
    reasons: ["no rule matched; fail_closed denies"],
    redacted_args: args,
    mode: policy.mode,
  };
}

export { BUILTIN_SECRET_OPS };
