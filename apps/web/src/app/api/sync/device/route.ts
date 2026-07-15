import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readStore, writeStore } from "@/lib/store";

/** Gateway 注册 device token，绑定 owner（local user id 或后续 Supabase uid） */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    owner?: string;
    deviceToken?: string;
  };
  const owner = body.owner?.trim();
  if (!owner) {
    return NextResponse.json({ error: "owner required" }, { status: 400 });
  }
  const token = body.deviceToken?.trim() || randomUUID();
  const store = readStore();
  store.devices[token] = { owner, created_at: new Date().toISOString() };
  writeStore(store);
  return NextResponse.json({ deviceToken: token, owner });
}
