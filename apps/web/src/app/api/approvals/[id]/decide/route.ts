import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  const { id } = await context.params;
  const form = await request.formData();
  const decision = String(form.get("decision") ?? "");
  const store = readStore();
  const item = store.approvals.find(
    (a) => a.id === id && a.owner === session.userId,
  );
  if (!item || item.status !== "pending") {
    return new NextResponse("approval not found", { status: 404 });
  }
  if (decision !== "allow" && decision !== "deny") {
    return new NextResponse("invalid decision", { status: 400 });
  }
  item.status = decision === "allow" ? "approved" : "denied";
  item.decided_at = new Date().toISOString();
  // 同步更新同 owner 下对应 pending 审计，便于 A5 回放
  const related = store.audits.find(
    (a) =>
      a.owner === session.userId &&
      a.server === item.server &&
      a.tool === item.tool &&
      a.action === "require_approval" &&
      a.result_status === "pending_approval",
  );
  if (related) {
    related.result_status =
      decision === "allow" ? "approved_then_allowed" : "denied_after_approval";
  }
  writeStore(store);
  return NextResponse.redirect(new URL("/app/approvals", request.url), 303);
}
