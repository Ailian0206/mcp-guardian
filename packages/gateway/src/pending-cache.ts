import type { Decision } from "@mcp-guardian/shared";

/** 待批调用的可重放上下文（批准后才真正打下游） */
export type PendingCall = {
  id: string;
  server: string;
  tool: string;
  forwardArgs: Record<string, unknown>;
  decision: Decision;
  createdAt: string;
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

/** 返回给 Agent 的待批说明：引导其在对话里问用户，再调 guardian_decide */
export function pendingApprovalPayload(call: PendingCall, ttlSeconds: number): string {
  return JSON.stringify(
    {
      status: "approval_required",
      approval_id: call.id,
      server: call.server,
      tool: call.tool,
      risk: call.decision.risk,
      reasons: call.decision.reasons,
      args_redacted: call.forwardArgs,
      ttl_seconds: ttlSeconds,
      agent_instructions: [
        "Do NOT claim the tool already ran.",
        "Ask the human user in this chat whether to allow or deny this call.",
        "If they approve, call tool guardian_decide with { id, decision: \"allow\" }.",
        "If they refuse, call tool guardian_decide with { id, decision: \"deny\" }.",
      ],
    },
    null,
    2,
  );
}
