import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readStore, validatePolicyYaml, writeStore } from "@/lib/store";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  const form = await request.formData();
  const yaml = String(form.get("yaml") ?? "");
  const checked = validatePolicyYaml(yaml);
  if (!checked.ok) {
    return new NextResponse(`Invalid policy: ${checked.error}`, { status: 400 });
  }
  const store = readStore();
  store.policies.default = yaml;
  writeStore(store);
  return NextResponse.redirect(new URL("/app/policies", request.url), 303);
}
