import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { ensureUserFixtures } from "@/lib/store";

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const store = ensureUserFixtures(session.userId);
  const pending = store.approvals.filter(
    (a) => a.owner === session.userId && a.status === "pending",
  );

  return (
    <AppShell nav={<a href="/app">← Dashboard</a>}>
      <h1>Approvals</h1>
      <p style={{ color: "#4d647f", maxWidth: 640, lineHeight: 1.6 }}>
        验收 A5：对高危 shell 点 Allow / Deny。真实 Gateway 场景里，未批准前工具不会执行；
        这里用本地样例演示审批动作本身。
      </p>
      {pending.length === 0 ? (
        <p>暂无待审批。可换一个显示名重新登录以再次注入样例，或通过 Gateway sync 推送。</p>
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
              <div style={{ fontSize: 12, color: "#4d647f", marginBottom: 6 }}>A5 样例</div>
              <div>
                <strong>
                  {item.server}.{item.tool}
                </strong>
              </div>
              <ul>
                {item.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <pre
                style={{
                  overflow: "auto",
                  background: "#0f1b2a",
                  color: "#e8eef7",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                {JSON.stringify(item.args_redacted, null, 2)}
              </pre>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <form action={`/api/approvals/${item.id}/decide`} method="post">
                  <input type="hidden" name="decision" value="allow" />
                  <button
                    type="submit"
                    style={{
                      background: "#16324f",
                      color: "#fff",
                      border: 0,
                      padding: "10px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Allow（批准）
                  </button>
                </form>
                <form action={`/api/approvals/${item.id}/decide`} method="post">
                  <input type="hidden" name="decision" value="deny" />
                  <button
                    type="submit"
                    style={{
                      background: "#fff",
                      color: "#16324f",
                      border: "1px solid #16324f",
                      padding: "10px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Deny（拒绝）
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
