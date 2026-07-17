import { AppShell } from "@/components/AppShell";

export default function HomePage() {
  return (
    <AppShell
      nav={
        <>
          <a href="/faq">FAQ</a>
          <a href="/demo">试跑策略</a>
          <a
            href="https://github.com/Ailian0206/mcp-guardian"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </>
      }
    >
      <p
        style={{
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#4d647f",
          fontSize: 12,
        }}
      >
        Local MCP middleware · not a dashboard SaaS
      </p>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", lineHeight: 1.1, margin: "12px 0 16px" }}>
        MCP Guardian
      </h1>
      <p style={{ maxWidth: 640, fontSize: 18, lineHeight: 1.6, color: "#33485f" }}>
        给 Cursor / Codex 用的本地策略网关：Agent 调工具前自动拦截。
        高危操作在<strong>同一次 Agent 对话</strong>里问你批不批——不用开网页审批台。
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <a
          href="/faq"
          style={{
            background: "#16324f",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          怎么用（FAQ）
        </a>
        <a
          href="/demo"
          style={{
            border: "1px solid #16324f",
            color: "#16324f",
            padding: "12px 18px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          浏览器里试跑策略
        </a>
      </div>

      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 20 }}>一键安装</h2>
        <pre
          style={{
            background: "#0f1b2a",
            color: "#e8eef7",
            padding: 16,
            borderRadius: 12,
            overflow: "auto",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >{`git clone https://github.com/Ailian0206/mcp-guardian.git
cd mcp-guardian
bash scripts/install.sh
# 重启 Cursor / Codex → 使用 mcp-guardian`}</pre>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 20 }}>日常怎么工作</h2>
        <ol style={{ maxWidth: 640, lineHeight: 1.7, color: "#33485f" }}>
          <li>Agent 正常调工具；多数 allow / deny / redact 自动完成。</li>
          <li>碰到高危：工具返回「需要批准」→ Agent 在对话里问你。</li>
          <li>你说可以 / 不行 → Agent 调用 <code>guardian_decide</code> → 继续或拒绝。</li>
        </ol>
      </section>

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
              <td style={td}>你怎么用</td>
              <td style={td}>打开观测站</td>
              <td style={td}>装进 IDE，跟 Agent 对话即可</td>
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
