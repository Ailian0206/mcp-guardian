import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { computeActionStats, readStore } from "@/lib/store";

export default async function AppHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const store = readStore();
  const mineApprovals = store.approvals.filter(
    (a) => a.owner === session.userId && a.status === "pending",
  );
  const mineAudits = store.audits.filter((a) => a.owner === session.userId);
  const stats = computeActionStats(mineAudits);

  return (
    <AppShell
      nav={
        <>
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
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          marginTop: 24,
        }}
      >
        <Stat label="Pending approvals" value={String(mineApprovals.length)} href="/app/approvals" />
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

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
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
    </a>
  );
}
