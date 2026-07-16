import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { ensureUserFixtures } from "@/lib/store";

export default async function AuditsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = ensureUserFixtures(session.userId);
  const audits = store.audits.filter((a) => a.owner === session.userId);

  return (
    <AppShell nav={<a href="/app">← Dashboard</a>}>
      <h1>Audits</h1>
      <p style={{ color: "#4d647f" }}>
        归属你的审计回放。点开可看脱敏参数——密钥不应以明文出现。
      </p>
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
              <div style={{ fontSize: 13, color: "#4d647f", marginTop: 6 }}>
                {item.reasons[0]}
              </div>
            </a>
          </li>
        ))}
      </ul>
      {audits.length === 0 ? <p>暂无审计。</p> : null}
    </AppShell>
  );
}
