import { AppShell } from "@/components/AppShell";

export default function LoginPage() {
  return (
    <AppShell nav={<a href="/">Home</a>}>
      <h1>登录 Dashboard</h1>
      <p style={{ color: "#4d647f", maxWidth: 560 }}>
        Week 3 使用本地开发者会话（不强制 GitHub/Supabase），避免阻塞与额外云费用。
        生产可再切换到 Supabase GitHub OAuth。
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
