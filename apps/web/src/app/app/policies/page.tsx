import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { ensureUserFixtures } from "@/lib/store";

export default async function PoliciesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = ensureUserFixtures(session.userId);
  const yaml = store.policies.default ?? "";

  return (
    <AppShell nav={<a href="/app">← Dashboard</a>}>
      <h1>Policies</h1>
      <p style={{ color: "#4d647f", maxWidth: 640, lineHeight: 1.6 }}>
        默认 fail-closed YAML。改完点保存会做 Zod 校验；公开 Demo 的现场试跑读的是仓库策略文件。
      </p>
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
