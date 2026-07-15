import { AppShell } from "@/components/AppShell";
import { computeActionStats, seedDemoFixtures } from "@/lib/store";

export default function DemoPage() {
  const store = seedDemoFixtures();
  const demos = store.audits.filter((a) => a.owner === "public");
  const stats = computeActionStats(demos);

  return (
    <AppShell
      nav={
        <>
          <a href="/">Home</a>
          <a href="/app">Dashboard</a>
        </>
      }
    >
      <h1>公开 Demo 回放</h1>
      <p style={{ color: "#4d647f" }}>无需登录。仅只读预置审计，不能改策略。</p>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
          marginTop: 20,
        }}
      >
        <Stat label="allow" value={stats.allow} />
        <Stat label="deny" value={stats.deny} />
        <Stat label="redact" value={stats.redact} />
        <Stat label="require_approval" value={stats.require_approval} />
      </div>

      <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
        {demos.map((item) => (
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
            <a href={`/demo/${item.id}`} style={{ color: "inherit", textDecoration: "none" }}>
              <strong>
                {item.server}.{item.tool}
              </strong>{" "}
              → {item.action} / {item.result_status}
            </a>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d5deea",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#4d647f" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
