import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DEMO_CASE_META } from "@/lib/demo-cases";
import { getPublicDemoAudit, listPublicDemoAudits } from "@/lib/demo-fixtures";

export function generateStaticParams() {
  return listPublicDemoAudits().map((item) => ({ id: item.id }));
}

export default async function DemoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getPublicDemoAudit(id);
  if (!item) notFound();
  const meta = DEMO_CASE_META[item.id];

  return (
    <AppShell
      nav={
        <>
          <Link href="/" style={navLink}>
            首页
          </Link>
          <Link href="/demo" style={navLink}>
            ← Demo
          </Link>
          <Link href="/faq" style={navLink}>
            FAQ
          </Link>
        </>
      }
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "var(--accent)",
          margin: 0,
        }}
      >
        {meta?.acceptance ?? "回放"} · {item.server}.{item.tool}
      </p>
      <h1 className="mg-h2" style={{ marginTop: 12, fontSize: "clamp(1.6rem, 3vw, 2rem)" }}>
        {meta?.title ?? `${item.server}.${item.tool}`}
      </h1>
      <p className="mg-lead" style={{ marginTop: 12 }}>
        {meta?.story ?? item.reasons.join("；")}
      </p>
      <p style={{ marginTop: 20, lineHeight: 1.6 }}>
        <strong>期望：</strong>
        {meta?.expect ?? `${item.action} / ${item.result_status}`}
      </p>
      <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
        实际：action=<code>{item.action}</code> · risk={item.risk} · rule=
        <code>{item.matched_rule_id ?? "none"}</code> · status=
        <code>{item.result_status}</code>
      </p>
      <h2 className="mg-h2" style={{ fontSize: 18, marginTop: 36 }}>
        脱敏后参数（审计可见）
      </h2>
      <pre className="mg-code" style={{ marginTop: 12 }}>
        {JSON.stringify(item.args_redacted, null, 2)}
      </pre>
      <h2 className="mg-h2" style={{ fontSize: 18, marginTop: 36 }}>
        Reasons
      </h2>
      <ul style={{ color: "var(--muted)", lineHeight: 1.7 }}>
        {item.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </AppShell>
  );
}

const navLink = {
  textDecoration: "none" as const,
  fontSize: 13,
  color: "var(--muted)",
  fontWeight: 500,
};
