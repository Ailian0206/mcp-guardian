"use client";

import { useState } from "react";
import { LIVE_TRY_PRESETS } from "@/lib/demo-cases";

type EvalResult = {
  ok?: boolean;
  error?: string;
  decision?: {
    action: string;
    risk: number;
    matched_rule_id: string | null;
    reasons: string[];
    redacted_args: Record<string, unknown>;
  };
  checks?: { secret_not_in_redacted_args: boolean };
};

export function LiveEvalPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [lastExpect, setLastExpect] = useState<string>("");

  async function run(key: string) {
    const preset = LIVE_TRY_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setLoading(key);
    setLastExpect(preset.expectAction);
    setResult(null);
    try {
      const res = await fetch("/api/demo/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server: preset.server,
          tool: preset.tool,
          args: preset.args,
        }),
      });
      const data = (await res.json()) as EvalResult;
      setResult(data);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(null);
    }
  }

  const pass =
    result?.decision &&
    result.decision.action === lastExpect &&
    (result.decision.action !== "redact" ||
      result.checks?.secret_not_in_redacted_args !== false);

  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>现场试跑策略（真引擎）</h2>
      <p style={{ color: "#4d647f", marginBottom: 16 }}>
        点下面按钮会调用本机 <code>/api/demo/eval</code>，用仓库默认 fail-closed
        策略即时评估——不是写死的假数据。
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {LIVE_TRY_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            disabled={loading !== null}
            onClick={() => void run(p.key)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #16324f",
              background: loading === p.key ? "#c5d4e6" : "#16324f",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {loading === p.key ? "评估中…" : p.label}
          </button>
        ))}
      </div>

      {result ? (
        <div
          style={{
            marginTop: 16,
            background: "#0f1b2a",
            color: "#e8eef7",
            borderRadius: 12,
            padding: 16,
          }}
        >
          {result.error ? (
            <p style={{ color: "#ff8a8a" }}>错误：{result.error}</p>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>
                结果：<strong>{result.decision?.action}</strong>
                {lastExpect ? (
                  <>
                    {" "}
                    · 期望 <code>{lastExpect}</code> ·{" "}
                    <span style={{ color: pass ? "#7dffa0" : "#ffb4b4" }}>
                      {pass ? "✓ 验收通过" : "✗ 与期望不符"}
                    </span>
                  </>
                ) : null}
              </p>
              <p style={{ fontSize: 13, color: "#9db0c7" }}>
                rule={result.decision?.matched_rule_id ?? "none"} · risk=
                {result.decision?.risk}
              </p>
              <pre style={{ overflow: "auto", fontSize: 12, marginBottom: 0 }}>
                {JSON.stringify(
                  {
                    reasons: result.decision?.reasons,
                    redacted_args: result.decision?.redacted_args,
                    checks: result.checks,
                  },
                  null,
                  2,
                )}
              </pre>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
