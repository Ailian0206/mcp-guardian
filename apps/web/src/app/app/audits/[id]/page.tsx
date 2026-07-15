import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { readStore } from "@/lib/store";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const item = readStore().audits.find(
    (a) => a.id === id && a.owner === session.userId,
  );
  if (!item) notFound();

  return (
    <AppShell nav={<a href="/app/audits">← Audits</a>}>
      <h1>
        {item.server}.{item.tool}
      </h1>
      <p>
        {item.action} · {item.result_status} · risk {item.risk}
      </p>
      <pre
        style={{
          background: "#0f1b2a",
          color: "#e8eef7",
          padding: 16,
          borderRadius: 12,
          overflow: "auto",
        }}
      >
        {JSON.stringify(item, null, 2)}
      </pre>
    </AppShell>
  );
}
