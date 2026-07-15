import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export default async function PoliciesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = readStore();
  const yaml = store.policies.default ?? "";

  return (
    <AppShell nav={<a href="/app">← Dashboard</a>}>
      <h1>Policies</h1>
      <form action="/api/policies" method="post">
        <textarea
          name="yaml"
          defaultValue={yaml}
          rows={22}
          style={{ width: "100%", fontFamily: "ui-monospace, monospace", padding: 12 }}
        />
        <button type="submit" style={{ marginTop: 12, padding: "10px 16px" }}>
          保存并校验
        </button>
      </form>
    </AppShell>
  );
}
