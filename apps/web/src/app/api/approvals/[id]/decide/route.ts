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
  writeStore(store);
  return NextResponse.redirect(new URL("/app/approvals", request.url), 303);
}
