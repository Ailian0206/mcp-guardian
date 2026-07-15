import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";
import type { Decision } from "@mcp-guardian/shared";

export type AuditRecord = {
  id: string;
  ts: string;
  server: string;
  tool: string;
  action: string;
  matched_rule_id: string | null;
  risk: number;
  latency_ms: number;
  args_redacted_json: string;
  result_status: string;
  reasons_json: string;
};

function defaultDbPath(): string {
  const home = process.env.MCP_GUARDIAN_HOME ?? path.join(os.homedir(), ".mcp-guardian");
  fs.mkdirSync(home, { recursive: true });
  return path.join(home, "state.db");
}

export class AuditStore {
  private readonly db: Database.Database;

  constructor(dbPath = defaultDbPath()) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        ts TEXT NOT NULL,
        server TEXT NOT NULL,
        tool TEXT NOT NULL,
        action TEXT NOT NULL,
        matched_rule_id TEXT,
        risk INTEGER NOT NULL,
        latency_ms INTEGER NOT NULL,
        args_redacted_json TEXT NOT NULL,
        result_status TEXT NOT NULL,
        reasons_json TEXT NOT NULL
      );
    `);
  }

  append(input: {
    id: string;
    server: string;
    tool: string;
    decision: Decision;
    latencyMs: number;
    resultStatus: string;
  }): void {
    this.db
      .prepare(
        `INSERT INTO audit_events (
          id, ts, server, tool, action, matched_rule_id, risk, latency_ms,
          args_redacted_json, result_status, reasons_json
        ) VALUES (
          @id, @ts, @server, @tool, @action, @matched_rule_id, @risk, @latency_ms,
          @args_redacted_json, @result_status, @reasons_json
        )`,
      )
      .run({
        id: input.id,
        ts: new Date().toISOString(),
        server: input.server,
        tool: input.tool,
        action: input.decision.action,
        matched_rule_id: input.decision.matched_rule_id,
        risk: input.decision.risk,
        latency_ms: input.latencyMs,
        args_redacted_json: JSON.stringify(input.decision.redacted_args),
        result_status: input.resultStatus,
        reasons_json: JSON.stringify(input.decision.reasons),
      });
  }

  list(limit = 50): AuditRecord[] {
    return this.db
      .prepare(
        `SELECT * FROM audit_events ORDER BY ts DESC LIMIT ?`,
      )
      .all(limit) as AuditRecord[];
  }

  get(id: string): AuditRecord | undefined {
    return this.db
      .prepare(`SELECT * FROM audit_events WHERE id = ?`)
      .get(id) as AuditRecord | undefined;
  }

  close(): void {
    this.db.close();
  }
}
