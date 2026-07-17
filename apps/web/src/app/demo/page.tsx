import { AppShell } from "@/components/AppShell";
import { LiveEvalPanel } from "@/components/LiveEvalPanel";
import {
  ACCEPTANCE_CHECKLIST,
  DEMO_CASE_META,
} from "@/lib/demo-cases";
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
      <h1>公开 Demo：调用前拦截长什么样</h1>
      <p style={{ color: "#4d647f", maxWidth: 720, lineHeight: 1.6 }}>
        这里不是空壳列表。下面可以<strong>现场试跑真实策略引擎</strong>，再对照预置审计回放。
        看懂 allow / deny / redact / require_approval 四种动作，就算 Demo 验收过关（A8）。
      </p>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18 }}>验收清单（A1–A8）</h2>
        <ol style={{ lineHeight: 1.7, color: "#33485f" }}>
          {ACCEPTANCE_CHECKLIST.map((item) => (
            <li key={item.id}>
              <strong>{item.id}</strong>：{item.text}{" "}
              <span style={{ color: "#4d647f" }}>（{item.where}）</span>
            </li>
          ))}
        </ol>
      </section>

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

      <LiveEvalPanel />

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20 }}>预置审计回放（只读）</h2>
        <p style={{ color: "#4d647f" }}>点开每条看「发生了什么 / 期望是什么」。不能改策略（A8）。</p>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
          {demos.map((item) => {
            const meta = DEMO_CASE_META[item.id];
            return (
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
                <a
                  href={`/demo/${item.id}`}
                  style={{ color: "inherit", textDecoration: "none", display: "block" }}
                >
                  <div style={{ fontSize: 12, color: "#4d647f", marginBottom: 4 }}>
                    {meta?.acceptance ?? "—"} · {item.action}
                  </div>
                  <strong style={{ fontSize: 16 }}>
                    {meta?.title ?? `${item.server}.${item.tool}`}
                  </strong>
                  <p style={{ margin: "8px 0 0", color: "#33485f", lineHeight: 1.5 }}>
                    {meta?.story ?? item.reasons.join("；")}
                  </p>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        style={{
          marginTop: 32,
          padding: 16,
          background: "#eef4fb",
          borderRadius: 12,
          color: "#33485f",
          lineHeight: 1.6,
        }}
      >
        <strong>完整闭环（含 Gateway）</strong>在终端跑：
        <pre style={{ marginTop: 8, overflow: "auto" }}>
          {`cd mcp-guardian && bash scenarios/a1-a8.sh`}
        </pre>
        Web 负责看懂四种动作 + 审批；真正代理 MCP Client 是本地 Gateway CLI。
      </section>
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
