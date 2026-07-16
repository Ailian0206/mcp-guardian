import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { computeActionStats, ensureUserFixtures } from "@/lib/store";

export default async function AppHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const store = ensureUserFixtures(session.userId);
  const mineApprovals = store.approvals.filter(
    (a) => a.owner === session.userId && a.status === "pending",
  );
  const mineAudits = store.audits.filter((a) => a.owner === session.userId);
  const stats = computeActionStats(mineAudits);

  return (
    <AppShell
      nav={
        <>
          <a href="/demo">公开 Demo</a>
          <a href="/app/policies">Policies</a>
          <a href="/app/approvals">Approvals</a>
          <a href="/app/audits">Audits</a>
          <form action="/api/auth/logout" method="post">
            <button type="submit">Logout</button>
          </form>
        </>
      }
    >
      <h1>Dashboard</h1>
      <p>已登录：{session.displayName}</p>

      <section
        style={{
          marginTop: 20,
          padding: 16,
          background: "#eef4fb",
          borderRadius: 12,
          lineHeight: 1.65,
          color: "#33485f",
        }}
      >
        <strong>本页怎么验收（约 2 分钟）</strong>
        <ol style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          <li>
            看下方统计是否同时有 allow / deny / redact / require_approval（样例已注入）。
          </li>
          <li>
            打开 <a href="/app/approvals">Approvals</a>，对 pending 的{" "}
            <code>rm -rf</code> 点 Allow 或 Deny（A5）。
          </li>
          <li>
            打开 <a href="/app/audits">Audits</a> 看脱敏参数；打开{" "}
            <a href="/app/policies">Policies</a> 看 fail-closed YAML（可改并校验）。
          </li>
          <li>
            公开访客路径请用 <a href="/demo">/demo</a> 的「现场试跑」。
          </li>
        </ol>
      </section>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          marginTop: 24,
        }}
      >
        <Stat
          label="Pending approvals"
          value={String(mineApprovals.length)}
          href="/app/approvals"
          hint={mineApprovals.length > 0 ? "点这里完成 A5" : "已无待批"}
        />
        <Stat label="Audits" value={String(mineAudits.length)} href="/app/audits" />
        <Stat label="allow" value={String(stats.allow)} href="/app/audits" />
        <Stat label="deny" value={String(stats.deny)} href="/app/audits" />
        <Stat label="redact" value={String(stats.redact)} href="/app/audits" />
        <Stat
          label="require_approval"
          value={String(stats.require_approval)}
          href="/app/approvals"
        />
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: string;
  href: string;
  hint?: string;
}) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid #d5deea",
        borderRadius: 12,
        padding: 16,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 12, color: "#4d647f" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>
      {hint ? <div style={{ fontSize: 12, color: "#16324f", marginTop: 6 }}>{hint}</div> : null}
    </a>
  );
}
