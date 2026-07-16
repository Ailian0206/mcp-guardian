import { AppShell } from "@/components/AppShell";

const faqs: { q: string; a: string }[] = [
  {
    q: "这是什么？",
    a: "装进 Cursor / Codex 的本地 MCP 中间层：在 Agent 调用工具之前做 allow / deny / redact / 需你批准。",
  },
  {
    q: "要不要天天开网页？",
    a: "不要。网页只做介绍与 FAQ。真正干活的是本机 Gateway。",
  },
  {
    q: "怎么安装？",
    a: "git clone 仓库后执行 bash scripts/install.sh，重启 Cursor/Codex，MCP 列表出现 mcp-guardian。",
  },
  {
    q: "危险操作怎么批？",
    a: "在 Agent 对话里批。Gateway 会返回 approval_required；Agent 问你是否允许，再调用 guardian_decide。不必另开终端。",
  },
  {
    q: "和 Langfuse / LangSmith 什么关系？",
    a: "它们是调用后观测（Trace）。Guardian 是调用前拦截。互补，不替代。",
  },
  {
    q: "现在护的是我的真实磁盘吗？",
    a: "默认演示下游是 demo-fs。接真实 MCP 需改 ~/.mcp-guardian/mcp-guardian.config.yaml 的 downstreams。",
  },
];

export default function FaqPage() {
  return (
    <AppShell
      nav={
        <>
          <a href="/">Home</a>
          <a href="/demo">试跑策略</a>
        </>
      }
    >
      <h1>常见问题</h1>
      <p style={{ color: "#4d647f", maxWidth: 640 }}>
        产品主路径在 IDE 里的 Agent 会话，不在本站后台。
      </p>
      <dl style={{ marginTop: 28, maxWidth: 720 }}>
        {faqs.map((item) => (
          <div
            key={item.q}
            style={{
              background: "#fff",
              border: "1px solid #d5deea",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <dt style={{ fontWeight: 700 }}>{item.q}</dt>
            <dd style={{ margin: "8px 0 0", color: "#33485f", lineHeight: 1.6 }}>{item.a}</dd>
          </div>
        ))}
      </dl>
    </AppShell>
  );
}
