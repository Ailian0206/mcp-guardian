import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DemoReel } from "@/components/DemoReel";

/** 里程碑 B：作品集门面——价值 / 步骤 / 演示 / 对比 / FAQ 摘要 */
export default function HomePage() {
  return (
    <AppShell
      fullBleedHero={
        <section
          style={{
            borderBottom: "1px solid var(--line)",
            background:
              "linear-gradient(105deg, #12151a 0%, #1a222c 48%, #0f3d32 100%)",
            color: "#f4f1ea",
            padding: "56px 20px 64px",
          }}
        >
          <div
            className="mg-hero-grid"
            style={{
              maxWidth: 1040,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
              gap: 40,
              alignItems: "end",
            }}
          >
            <div>
              <p
                className="mg-reveal"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#7dceb8",
                  margin: 0,
                }}
              >
                Local MCP middleware · not a dashboard SaaS
              </p>
              <h1
                className="mg-reveal mg-reveal-d1"
                style={{
                  fontSize: "clamp(2.4rem, 6vw, 3.8rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                  margin: "18px 0 18px",
                  fontWeight: 600,
                }}
              >
                MCP Guardian
              </h1>
              <p
                className="mg-reveal mg-reveal-d2"
                style={{
                  maxWidth: 420,
                  fontSize: 17,
                  lineHeight: 1.6,
                  color: "rgba(244,241,234,0.78)",
                  margin: 0,
                }}
              >
                给 Cursor / Codex 用的本地策略网关：Agent 调工具前自动拦截。
                高危操作在<strong style={{ color: "#fff", fontWeight: 600 }}>同一次对话</strong>
                里问你批不批——不用开网页审批台。
              </p>
              <div
                className="mg-reveal mg-reveal-d3"
                style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}
              >
                <a
                  href="#install"
                  className="mg-cta"
                  style={{ background: "#2dd4a8", color: "#06281f" }}
                >
                  看安装步骤
                </a>
                <Link
                  href="/demo"
                  className="mg-cta"
                  style={{
                    border: "1px solid rgba(244,241,234,0.45)",
                    color: "#f4f1ea",
                  }}
                >
                  浏览器里试跑策略
                </Link>
              </div>
            </div>

            <div className="mg-reveal mg-reveal-d2">
              <DemoReel />
            </div>
          </div>
          <div className="mg-flow-rail" style={{ maxWidth: 1040, margin: "36px auto 0" }} />
        </section>
      }
    >
      <section id="value" className="mg-section" style={{ paddingTop: 8 }}>
        <p className="mg-kicker">为什么需要</p>
        <h2 className="mg-h2">拦在调用前，而不是事后翻 Trace</h2>
        <p className="mg-lead">
          Agent 接上 MCP 后，危险写、密钥外泄、越权读往往已经发生才被观测到。
          Guardian 只做一件事：在 <code>tools/call</code> 真正执行前做策略决策。
        </p>
        <div style={{ marginTop: 28 }}>
          {[
            {
              t: "乱写系统路径 / 跑高危命令",
              d: "策略 deny 或 require_approval；未批准前下游不执行。",
            },
            {
              t: "API Key 进 URL / Header",
              d: "redact 改写后再转发，审计里只留脱敏摘要。",
            },
            {
              t: "出事后说不清当时允不允许",
              d: "每次决策写本地 SQLite，可用 CLI / MCP 工具回看。",
            },
          ].map((item, i) => (
            <div key={item.t} className="mg-step-row">
              <div className="mg-step-num">0{i + 1}</div>
              <div>
                <strong style={{ fontSize: 16 }}>{item.t}</strong>
                <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                  {item.d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="install" className="mg-section">
        <p className="mg-kicker">操作步骤</p>
        <h2 className="mg-h2">一键安装</h2>
        <p className="mg-lead">
          一条命令写入 Cursor / Codex MCP 配置与本机 Gateway。装完重启 IDE，列表出现{" "}
          <code>mcp-guardian</code> 即可。
        </p>
        <pre className="mg-code" style={{ marginTop: 20 }}>{`git clone https://github.com/Ailian0206/mcp-guardian.git
cd mcp-guardian
bash scripts/install.sh
# 重启 Cursor / Codex → 使用 mcp-guardian`}</pre>
        <p style={{ marginTop: 14, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
          仅一边：<code>bash scripts/install.sh --cursor</code> 或{" "}
          <code>--codex</code>。默认挂演示下游；接真实磁盘见下方「真实下游」。
        </p>
      </section>

      <section id="how" className="mg-section">
        <p className="mg-kicker">日常怎么工作</p>
        <h2 className="mg-h2">装上就能用，审批留在对话里</h2>
        <div style={{ marginTop: 8 }}>
          {[
            {
              n: "01",
              t: "自动拦",
              d: "Agent 正常调工具；allow / deny / redact 多数无感完成。",
            },
            {
              n: "02",
              t: "高危挂起",
              d: "返回 approval_required（含 confirm_code）→ Agent 在对话里问你。",
            },
            {
              n: "03",
              t: "你说可以 / 不行",
              d: "Agent 调用 guardian_decide；allow 必须带同一 confirm_code，然后继续或结束。",
            },
          ].map((s) => (
            <div key={s.n} className="mg-step-row">
              <div className="mg-step-num">{s.n}</div>
              <div>
                <strong style={{ fontSize: 16 }}>{s.t}</strong>
                <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
                  {s.d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="real" className="mg-section">
        <p className="mg-kicker">真实下游</p>
        <h2 className="mg-h2">不止 demo：官方 Filesystem MCP</h2>
        <p className="mg-lead">
          默认 profile 是演示工具。要护真实目录时，用 filesystem 画像并强制{" "}
          <code>--workspace</code>（禁止回退 cwd）。
        </p>
        <pre className="mg-code" style={{ marginTop: 20 }}>{`pnpm build
node packages/gateway/dist/cli.js install --cursor \\
  --profile filesystem --workspace /ABS/PATH/TO/DIR
# 读放行；写/改/移 → 会话内 confirm_code + guardian_decide`}</pre>
      </section>

      <section id="diff" className="mg-section">
        <p className="mg-kicker">边界</p>
        <h2 className="mg-h2">与 Trace 平台的差异</h2>
        <table className="mg-table">
          <thead>
            <tr>
              <th>能力</th>
              <th>Langfuse / LangSmith</th>
              <th>MCP Guardian</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>时机</td>
              <td>调用后观测</td>
              <td>调用前拦截</td>
            </tr>
            <tr>
              <td>你怎么用</td>
              <td>打开观测站</td>
              <td>装进 IDE，跟 Agent 对话即可</td>
            </tr>
            <tr>
              <td>核心对象</td>
              <td>Trace / Span</td>
              <td>Tool call / Policy / Approval / Audit</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="faq-preview" className="mg-section">
        <p className="mg-kicker">常见问题</p>
        <h2 className="mg-h2">先扫这几条</h2>
        <div style={{ marginTop: 8 }}>
          {[
            {
              q: "要不要天天开网页？",
              a: "不要。网页只做介绍、FAQ 与可选策略试跑。真正干活的是本机 Gateway。",
            },
            {
              q: "危险操作怎么批？",
              a: "在 Agent 对话里批：看 confirm_code → 同意后 Agent 调 guardian_decide。",
            },
            {
              q: "和 Langfuse 什么关系？",
              a: "互补：它们事后观测，Guardian 事前拦截。",
            },
          ].map((item) => (
            <div key={item.q} className="mg-faq-item">
              <p className="mg-faq-q">{item.q}</p>
              <p className="mg-faq-a">{item.a}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <a href="/faq" className="mg-cta mg-cta-secondary">
            查看完整 FAQ
          </a>
        </div>
      </section>

      <section className="mg-section" style={{ paddingBottom: 8 }}>
        <p className="mg-kicker">下一步</p>
        <h2 className="mg-h2">五分钟跑通主路径</h2>
        <p className="mg-lead" style={{ marginBottom: 24 }}>
          安装 → 在 IDE 里触发一次危险写 → 对话内批准。想先看懂四种动作，可在浏览器试跑。
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="#install" className="mg-cta mg-cta-primary">
            回到安装
          </a>
          <a href="/demo" className="mg-cta mg-cta-secondary">
            去试跑四种动作
          </a>
          <a
            href="https://github.com/Ailian0206/mcp-guardian"
            className="mg-cta mg-cta-secondary"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </section>
    </AppShell>
  );
}
