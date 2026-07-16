import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DEMO_CASE_META } from "@/lib/demo-cases";
import { seedDemoFixtures } from "@/lib/store";

export default async function DemoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = seedDemoFixtures();
  const item = store.audits.find((a) => a.id === id && a.owner === "public");
  if (!item) notFound();
  const meta = DEMO_CASE_META[item.id];

  return (
    <AppShell nav={<a href="/demo">← Demo</a>}>
      <p style={{ fontSize: 12, color: "#4d647f", letterSpacing: "0.06em" }}>
        {meta?.acceptance ?? "回放"} · {item.server}.{item.tool}
      </p>
      <h1 style={{ marginTop: 8 }}>{meta?.title ?? `${item.server}.${item.tool}`}</h1>
      <p style={{ maxWidth: 640, lineHeight: 1.6, color: "#33485f" }}>
        {meta?.story ?? item.reasons.join("；")}
      </p>
      <p>
        <strong>期望：</strong>
        {meta?.expect ?? `${item.action} / ${item.result_status}`}
      </p>
      <p>
        实际：action=<code>{item.action}</code> · risk={item.risk} · rule=
        <code>{item.matched_rule_id ?? "none"}</code> · status=
        <code>{item.result_status}</code>
      </p>
      <h2>脱敏后参数（审计可见）</h2>
      <pre
        style={{
          background: "#0f1b2a",
          color: "#e8eef7",
          padding: 16,
          borderRadius: 12,
          overflow: "auto",
        }}
      >
        {JSON.stringify(item.args_redacted, null, 2)}
      </pre>
      <h2>Reasons</h2>
      <ul>
        {item.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </AppShell>
  );
}
