import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
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

  return (
    <AppShell nav={<a href="/demo">← Demo</a>}>
      <h1>
        {item.server}.{item.tool}
      </h1>
      <p>
        action=<code>{item.action}</code> · risk={item.risk} · rule=
        <code>{item.matched_rule_id ?? "none"}</code>
      </p>
      <h2>脱敏参数</h2>
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
