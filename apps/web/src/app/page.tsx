import { AppShell } from "@/components/AppShell";

export default function HomePage() {
  return (
    <AppShell
      nav={
        <>
          <a href="/demo">Demo</a>
          <a href="/app">Dashboard</a>
        </>
      }
    >
      <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "#4d647f", fontSize: 12 }}>
        Pre-call policy · not post-call trace
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", lineHeight: 1.1, margin: "12px 0 16px" }}>
        MCP Guardian
      </h1>
      <p style={{ maxWidth: 640, fontSize: 18, lineHeight: 1.6, color: "#33485f" }}>
        在 Agent 调用 MCP 工具之前执行 allow / deny / redact / require_approval，
        并留下可回放的审计记录。这不是 Langfuse/LangSmith 一类的 Trace 平台。
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <a
          href="/demo"
          style={{
            background: "#16324f",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          查看公开 Demo
        </a>
        <a
          href="/app"
          style={{
            border: "1px solid #16324f",
            color: "#16324f",
            padding: "12px 18px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          进入 Dashboard
        </a>
      </div>
      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 20 }}>与 Trace 平台的差异</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th style={th}>能力</th>
              <th style={th}>Langfuse / LangSmith</th>
              <th style={th}>MCP Guardian</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}>时机</td>
              <td style={td}>调用后观测</td>
              <td style={td}>调用前拦截</td>
            </tr>
            <tr>
              <td style={td}>对象</td>
              <td style={td}>Trace / 评测</td>
              <td style={td}>Tool Call / Policy / Approval</td>
            </tr>
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}

const th = {
  textAlign: "left" as const,
  borderBottom: "1px solid #c9d6e6",
  padding: "8px 6px",
  fontSize: 13,
};
const td = {
  borderBottom: "1px solid #e2eaf3",
  padding: "10px 6px",
  fontSize: 14,
  verticalAlign: "top" as const,
};
