import { AppShell } from "@/components/AppShell";
import { LiveEvalPanel } from "@/components/LiveEvalPanel";
import {
  ACCEPTANCE_CHECKLIST,
  DEMO_CASE_META,
} from "@/lib/demo-cases";
import { computeActionStats, seedDemoFixtures } from "@/lib/store";

/** 公开试跑页：帮助理解四种动作；不导向 Dashboard 审批 */
export default function DemoPage() {
  const store = seedDemoFixtures();
  const demos = store.audits.filter((a) => a.owner === "public");
  const stats = computeActionStats(demos);

  return (
    <AppShell
      nav={
        <>
          <a href="/" style={navLink}>
            首页
          </a>
          <a href="/faq" style={navLink}>
            FAQ
          </a>
          <a href="/#install" style={navLink}>
            安装
          </a>
        </>
      }
    >
      <p className="mg-kicker">试跑</p>
      <h1 className="mg-h2" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)" }}>
        公开 Demo：调用前拦截长什么样
      </h1>
      <p className="mg-lead">
        这里不是空壳列表。下面可以<strong>现场试跑真实策略引擎</strong>，再对照预置审计回放。
        看懂 allow / deny / redact / require_approval 四种动作，就算 Demo 验收过关（A8）。
        真正装进 IDE 后，审批在 Agent 对话里完成。
      </p>

      <section style={{ marginTop: 36 }}>
        <h2 className="mg-h2" style={{ fontSize: 18 }}>
          验收清单（A1–A8）
        </h2>
        <ol style={{ lineHeight: 1.7, color: "var(--muted)", paddingLeft: 18 }}>
          {ACCEPTANCE_CHECKLIST.map((item) => (
            <li key={item.id} style={{ marginBottom: 6 }}>
              <strong style={{ color: "var(--ink)" }}>{item.id}</strong>：{item.text}{" "}
              <span style={{ color: "var(--muted)" }}>（{item.where}）</span>
            </li>
          ))}
        </ol>
      </section>

      <div
        style={{
          display: "grid",
          gap: 0,
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          marginTop: 28,
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Stat label="allow" value={stats.allow} />
        <Stat label="deny" value={stats.deny} />
        <Stat label="redact" value={stats.redact} />
        <Stat label="require_approval" value={stats.require_approval} />
      </div>

      <LiveEvalPanel />

      <section style={{ marginTop: 48 }}>
        <h2 className="mg-h2" style={{ fontSize: 20 }}>
          预置审计回放（只读）
        </h2>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>
          点开每条看「发生了什么 / 期望是什么」。不能改策略（A8）。
        </p>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
          {demos.map((item) => {
            const meta = DEMO_CASE_META[item.id];
            return (
              <li key={item.id} className="mg-faq-item">
                <a
                  href={`/demo/${item.id}`}
                  style={{ color: "inherit", textDecoration: "none", display: "block" }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      color: "var(--accent)",
                      marginBottom: 6,
                    }}
                  >
                    {meta?.acceptance ?? "—"} · {item.action}
                  </div>
                  <strong style={{ fontSize: 16 }}>
                    {meta?.title ?? `${item.server}.${item.tool}`}
                  </strong>
                  <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.5 }}>
                    {meta?.story ?? item.reasons.join("；")}
                  </p>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section style={{ marginTop: 40 }}>
        <p className="mg-kicker">本机完整闭环</p>
        <p className="mg-lead" style={{ marginBottom: 12 }}>
          浏览器试跑只验证策略理解；Gateway + IDE 闭环请在仓库根目录跑：
        </p>
        <pre className="mg-code">{`cd mcp-guardian
bash scenarios/a1-a8.sh
bash scenarios/ide-smoke.sh
bash scenarios/real-filesystem.sh`}</pre>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: "16px 12px", borderRight: "1px solid var(--line)" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, marginTop: 6, letterSpacing: "-0.03em" }}>
        {value}
      </div>
    </div>
  );
}

const navLink = {
  textDecoration: "none" as const,
  fontSize: 13,
  color: "var(--muted)",
  fontWeight: 500,
};
