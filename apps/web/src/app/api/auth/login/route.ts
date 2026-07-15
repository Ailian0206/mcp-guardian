import { NextResponse } from "next/server";
import { encodeSession, SESSION_COOKIE } from "@/lib/auth";
import { createHash } from "node:crypto";

export async function POST(request: Request) {
  const form = await request.formData();
  const displayName = String(form.get("displayName") ?? "local-dev").trim() || "local-dev";
  const userId = createHash("sha256").update(displayName).digest("hex").slice(0, 16);
  const session = encodeSession({ userId, displayName });
  const res = NextResponse.redirect(new URL("/app", request.url), 303);
  res.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
