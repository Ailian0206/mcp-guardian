import { randomBytes } from "node:crypto";
import type { Decision } from "@mcp-guardian/shared";

/** 待批调用的可重放上下文（批准后才真正打下游） */
export type PendingCall = {
  id: string;
  server: string;
  tool: string;
  forwardArgs: Record<string, unknown>;
  decision: Decision;
  createdAt: string;
  /** 人类确认码：allow 时 guardian_decide 必须带上；降低 Agent 静默自批 */
  confirmCode: string;
};

export class PendingCallCache {
  private readonly map = new Map<string, PendingCall>();

  put(call: PendingCall): void {
    this.map.set(call.id, call);
  }

  get(id: string): PendingCall | undefined {
    return this.map.get(id);
  }

  take(id: string): PendingCall | undefined {
    const v = this.map.get(id);
    if (v) this.map.delete(id);
    return v;
  }

  list(): PendingCall[] {
    return [...this.map.values()];
  }
}

/** 生成短确认码（人类可读、Agent 须向用户索取后再提交） */
export function newConfirmCode(): string {
  return randomBytes(3).toString("hex");
}

/** allow 必须校验确认码；deny 不要求（拒绝不应被码挡住） */
export function confirmCodeOk(
  call: PendingCall,
  decision: "allow" | "deny",
  provided: string | undefined,
): boolean {
  if (decision === "deny") return true;
  return Boolean(provided) && provided === call.confirmCode;
}

/** 返回给 Agent 的待批说明：引导其在对话里问用户，再调 guardian_decide */
export function pendingApprovalPayload(call: PendingCall, ttlSeconds: number): string {
  return JSON.stringify(
    {
      status: "approval_required",
      approval_id: call.id,
      confirm_code: call.confirmCode,
      server: call.server,
      tool: call.tool,
      risk: call.decision.risk,
      reasons: call.decision.reasons,
      args_redacted: call.forwardArgs,
      ttl_seconds: ttlSeconds,
      agent_instructions: [
        "Do NOT claim the tool already ran.",
        "Do NOT call guardian_decide allow until the human explicitly confirms in this chat.",
        `Show the human confirm_code=${call.confirmCode} and ask them to approve or deny.`,
        "If they approve, call guardian_decide with { id, decision: \"allow\", confirm_code } using the same code.",
        "If they refuse, call guardian_decide with { id, decision: \"deny\" } (confirm_code optional).",
      ],
    },
    null,
    2,
  );
}
