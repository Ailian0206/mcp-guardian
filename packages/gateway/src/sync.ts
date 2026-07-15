export type SyncClientOptions = {
  endpoint: string;
  deviceToken: string;
};

export class SyncClient {
  constructor(private readonly options: SyncClientOptions) {}

  async pushAndPull(input: {
    approvals?: Array<{
      id: string;
      status: "pending" | "approved" | "denied" | "expired";
      server: string;
      tool: string;
      args_redacted: Record<string, unknown>;
      reasons: string[];
      created_at: string;
      decided_at: string | null;
    }>;
    audits?: Array<{
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
    }>;
  }): Promise<{
    decided: Array<{ id: string; status: string }>;
    policyYaml: string;
  }> {
    const res = await fetch(`${this.options.endpoint.replace(/\/$/, "")}/api/sync/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-device-token": this.options.deviceToken,
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(`sync failed: ${res.status}`);
    }
    return (await res.json()) as {
      decided: Array<{ id: string; status: string }>;
      policyYaml: string;
    };
  }
}

export async function registerDevice(endpoint: string, owner: string): Promise<string> {
  const res = await fetch(`${endpoint.replace(/\/$/, "")}/api/sync/device`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ owner }),
  });
  if (!res.ok) throw new Error(`device register failed: ${res.status}`);
  const json = (await res.json()) as { deviceToken: string };
  return json.deviceToken;
}
