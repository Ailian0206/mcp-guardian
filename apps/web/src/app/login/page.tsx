import { AppShell } from "@/components/AppShell";

export default function LoginPage() {
  return (
    <AppShell nav={<a href="/">Home</a>}>
      <h1>登录 Dashboard</h1>
      <p style={{ color: "#4d647f", maxWidth: 560, lineHeight: 1.6 }}>
        本地会话即可。登录后会注入验收样例：待审批的高危 shell（A5）+ 四种动作的审计统计。
        显示名可随便填（例如 <code>local-dev</code>）。
      </p>
      <form action="/api/auth/login" method="post" style={{ marginTop: 24, display: "grid", gap: 12, maxWidth: 360 }}>
        <label>
          显示名
          <input
            name="displayName"
            defaultValue="local-dev"
            required
            style={{ display: "block", width: "100%", marginTop: 6, padding: 10 }}
          />
        </label>
        <button
          type="submit"
          style={{
            background: "#16324f",
            color: "#fff",
            border: 0,
            padding: "12px 16px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          继续
        </button>
      </form>
    </AppShell>
  );
}
