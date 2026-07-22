import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

const shell: CSSProperties = {
  minHeight: "100dvh",
  // 纸面底 + 细网格，避免单色平铺
  backgroundColor: "var(--bg)",
  backgroundImage:
    "linear-gradient(180deg, rgba(15,110,86,0.06) 0%, transparent 42%), radial-gradient(circle at 1px 1px, rgba(18,22,28,0.07) 1px, transparent 0)",
  backgroundSize: "auto, 22px 22px",
  color: "var(--ink)",
};

const main: CSSProperties = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: "28px 20px 88px",
};

const linkStyle: CSSProperties = {
  textDecoration: "none",
  fontSize: 13,
  color: "var(--muted)",
  fontWeight: 500,
};

/** 公开页统一壳：导航偏说明书，不推 Dashboard */
export function AppShell({
  children,
  nav,
  fullBleedHero,
}: {
  children: ReactNode;
  nav?: ReactNode;
  /** 落地页 hero 可顶满视口宽，正文仍进 main */
  fullBleedHero?: ReactNode;
}) {
  return (
    <div style={shell}>
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          background: "rgba(250,249,246,0.86)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            ...main,
            paddingTop: 14,
            paddingBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 700,
              textDecoration: "none",
              color: "inherit",
              letterSpacing: "-0.02em",
              fontSize: 15,
            }}
          >
            MCP Guardian
          </Link>
          <nav
            style={{
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {nav ?? (
              <>
                <Link href="/#how" style={linkStyle}>
                  怎么用
                </Link>
                <Link href="/faq" style={linkStyle}>
                  FAQ
                </Link>
                <Link href="/demo" style={linkStyle}>
                  试跑策略
                </Link>
                <a
                  href="https://github.com/Ailian0206/mcp-guardian"
                  target="_blank"
                  rel="noreferrer"
                  style={linkStyle}
                >
                  GitHub
                </a>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>
        {fullBleedHero}
        <div style={main}>{children}</div>
      </main>
      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "28px 20px 40px",
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto", lineHeight: 1.6 }}>
          本站只做介绍、安装说明、FAQ 与策略试跑。真正执行在本机 Gateway；日常审批在
          Agent 对话里完成，不依赖网页审批台。
        </div>
      </footer>
    </div>
  );
}
