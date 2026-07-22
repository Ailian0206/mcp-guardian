import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const groups: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "入门",
    items: [
      {
        q: "这是什么？",
        a: "装进 Cursor / Codex 的本地 MCP 中间层：在 Agent 调用工具之前做 allow / deny / redact / 需你批准。",
      },
      {
        q: "要不要天天开网页？",
        a: "不要。网页只做介绍、FAQ 与可选策略试跑。真正干活的是本机 Gateway。",
      },
      {
        q: "怎么安装？",
        a: "git clone 仓库后执行 bash scripts/install.sh，重启 Cursor/Codex，MCP 列表出现 mcp-guardian。仅一边可用 --cursor 或 --codex。",
      },
    ],
  },
  {
    title: "日常使用",
    items: [
      {
        q: "危险操作怎么批？",
        a: "在 Agent 对话里批。Gateway 返回 approval_required（含 confirm_code）；Agent 把码给你看并问是否允许；你同意后 Agent 调用 guardian_decide（allow 必须带同一 confirm_code）。不必另开终端，也不用网页审批台。",
      },
      {
        q: "guardian_pending / guardian_decide 是什么？",
        a: "同一 MCP 暴露的辅助工具：pending 查看待批；decide 提交 allow/deny。allow 必须携带返回里的 confirm_code，否则拒绝。",
      },
      {
        q: "默认演示有哪些工具？",
        a: "默认 profile=demos：demo-fs / demo-shell / demo-http。多下游时工具名是 server__tool。",
      },
    ],
  },
  {
    title: "真实下游",
    items: [
      {
        q: "怎么接官方 Filesystem MCP？",
        a: "pnpm build 后执行：node packages/gateway/dist/cli.js install --cursor --profile filesystem --workspace /你的目录。策略用 policies/filesystem.fail-closed.yaml：读放行，写/改/移需会话内批准。示例见 examples/real-filesystem.config.yaml。切回演示加 --profile demos。",
      },
      {
        q: "为什么 filesystem 必须带 --workspace？",
        a: "防止误用当前 cwd 当沙箱。缺 workspace 时安装会失败，不会悄悄回退。",
      },
    ],
  },
  {
    title: "边界与排错",
    items: [
      {
        q: "和 Langfuse / LangSmith 什么关系？",
        a: "它们是调用后观测（Trace）。Guardian 是调用前拦截。互补，不替代。",
      },
      {
        q: "装了但 MCP 列表没有？",
        a: "确认 scripts/install.sh 跑通、重启或 Reload MCP；Cursor 看 ~/.cursor/mcp.json，Codex 看 ~/.codex/config.toml。",
      },
      {
        q: "Web Dashboard 还要不要用？",
        a: "代码保留，但不是产品主路径。日常请用 IDE 会话内审批；本站不要当审批台。",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <AppShell
      nav={
        <>
          <Link href="/" style={navLink}>
            首页
          </Link>
          <Link href="/#how" style={navLink}>
            怎么用
          </Link>
          <Link href="/demo" style={navLink}>
            试跑策略
          </Link>
        </>
      }
    >
      <p className="mg-kicker">FAQ</p>
      <h1 className="mg-h2" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)" }}>
        常见问题
      </h1>
      <p className="mg-lead">
        产品主路径在 IDE 里的 Agent 会话，不在本站后台。下面按「入门 → 日常 → 真实下游 →
        排错」组织。
      </p>

      {groups.map((group) => (
        <section key={group.title} style={{ marginTop: 40 }}>
          <h2
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              margin: "0 0 8px",
              fontWeight: 500,
            }}
          >
            {group.title}
          </h2>
          <div>
            {group.items.map((item) => (
              <div key={item.q} className="mg-faq-item">
                <p className="mg-faq-q">{item.q}</p>
                <p className="mg-faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section style={{ marginTop: 48 }}>
        <Link href="/#install" className="mg-cta mg-cta-primary">
          去看安装步骤
        </Link>
      </section>
    </AppShell>
  );
}

const navLink = {
  textDecoration: "none" as const,
  fontSize: 13,
  color: "var(--muted)",
  fontWeight: 500,
};
