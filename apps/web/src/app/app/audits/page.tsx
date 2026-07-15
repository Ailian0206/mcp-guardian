import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export default async function AuditsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = readStore();
  const audits = store.audits.filter((a) => a.owner === session.userId);

  return (
    <AppShell nav={<a href="/app">← Dashboard</a>}>
      <h1>Audits</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {audits.map((item) => (
          <li
            key={item.id}
            style={{
              background: "#fff",
              border: "1px solid #d5deea",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <a href={`/app/audits/${item.id}`} style={{ color: "inherit", textDecoration: "none" }}>
              <strong>
                {item.server}.{item.tool}
              </strong>{" "}
              → {item.action} / {item.result_status}
            </a>
          </li>
        ))}
      </ul>
      {audits.length === 0 ? <p>暂无审计。可通过 Gateway sync 上传脱敏事件。</p> : null}
    </AppShell>
  );
}
