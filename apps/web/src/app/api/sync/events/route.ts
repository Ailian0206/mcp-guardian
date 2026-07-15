import { NextResponse } from "next/server";
import { readStore, writeStore, type CloudApproval, type CloudAudit } from "@/lib/store";

function ownerFromAuth(request: Request): string | null {
  const token = request.headers.get("x-device-token");
  if (!token) return null;
  const device = readStore().devices[token];
  return device?.owner ?? null;
}

/** Gateway 上传脱敏审计 + 待审批；拉取已决策审批 */
export async function POST(request: Request) {
  const owner = ownerFromAuth(request);
  if (!owner) {
    return NextResponse.json({ error: "unauthorized device" }, { status: 401 });
  }
  const body = (await request.json()) as {
    audits?: CloudAudit[];
    approvals?: CloudApproval[];
  };
  const store = readStore();

  for (const audit of body.audits ?? []) {
    const next = { ...audit, owner };
    const idx = store.audits.findIndex((a) => a.id === next.id);
    if (idx >= 0) store.audits[idx] = next;
    else store.audits.unshift(next);
  }

  for (const approval of body.approvals ?? []) {
    const existing = store.approvals.find((a) => a.id === approval.id);
    if (existing && existing.status !== "pending") continue;
    const next = { ...approval, owner };
    const idx = store.approvals.findIndex((a) => a.id === next.id);
    if (idx >= 0) store.approvals[idx] = { ...store.approvals[idx]!, ...next };
    else store.approvals.unshift(next);
  }

  writeStore(store);

  const decided = store.approvals.filter(
    (a) =>
      a.owner === owner &&
      (a.status === "approved" || a.status === "denied"),
  );

  return NextResponse.json({
    decided,
    policyYaml: store.policies.default ?? "",
  });
}

export async function GET(request: Request) {
  const owner = ownerFromAuth(request);
  if (!owner) {
    return NextResponse.json({ error: "unauthorized device" }, { status: 401 });
  }
  const store = readStore();
  const decided = store.approvals.filter(
    (a) =>
      a.owner === owner &&
      (a.status === "approved" || a.status === "denied"),
  );
  return NextResponse.json({
    decided,
    policyYaml: store.policies.default ?? "",
  });
}
