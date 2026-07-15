import type { CSSProperties, ReactNode } from "react";

const shell: CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  fontFamily:
    '"IBM Plex Sans", "Segoe UI", sans-serif',
  background:
    "radial-gradient(1200px 600px at 10% -10%, #dce9ff 0%, transparent 55%), linear-gradient(180deg, #f4f7fb 0%, #eef2f7 100%)",
  color: "#122033",
};

const main: CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "32px 20px 64px",
};

export function AppShell({
  children,
  nav,
}: {
  children: ReactNode;
  nav?: ReactNode;
}) {
  return (
    <div style={shell}>
      <header
        style={{
          borderBottom: "1px solid #d5deea",
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            ...main,
            paddingTop: 16,
            paddingBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <a href="/" style={{ fontWeight: 700, textDecoration: "none", color: "inherit" }}>
            MCP Guardian
          </a>
          <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>{nav}</nav>
        </div>
      </header>
      <main style={main}>{children}</main>
    </div>
  );
}
