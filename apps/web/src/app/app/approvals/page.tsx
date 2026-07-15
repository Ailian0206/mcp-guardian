import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = readStore();
  const pending = store.approvals.filter(
    (a) => a.owner === session.userId && a.status === "pending",
  );

  return (
    <AppShell nav={<a href="/app">← Dashboard</a>}>
      <h1>Approvals</h1>
      {pending.length === 0 ? (
        <p>暂无待审批。</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {pending.map((item) => (
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
              <div>
                <strong>
                  {item.server}.{item.tool}
                </strong>
              </div>
              <pre style={{ overflow: "auto" }}>{JSON.stringify(item.args_redacted, null, 2)}</pre>
              <div style={{ display: "flex", gap: 8 }}>
                <form action={`/api/approvals/${item.id}/decide`} method="post">
                  <input type="hidden" name="decision" value="allow" />
                  <button type="submit">Allow</button>
                </form>
                <form action={`/api/approvals/${item.id}/decide`} method="post">
                  <input type="hidden" name="decision" value="deny" />
                  <button type="submit">Deny</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
