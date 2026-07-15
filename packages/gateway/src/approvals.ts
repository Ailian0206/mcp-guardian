import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "denied"
  | "expired";

export type ApprovalRecord = {
  id: string;
  created_at: string;
  expires_at: string;
  status: ApprovalStatus;
  server: string;
  tool: string;
  args_redacted_json: string;
  reasons_json: string;
  decided_at: string | null;
};

function defaultDbPath(): string {
  const home =
    process.env.MCP_GUARDIAN_HOME ?? path.join(os.homedir(), ".mcp-guardian");
  fs.mkdirSync(home, { recursive: true });
  return path.join(home, "state.db");
}

export class ApprovalStore {
  private readonly db: Database.Database;

  constructor(dbPath = defaultDbPath()) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        status TEXT NOT NULL,
        server TEXT NOT NULL,
        tool TEXT NOT NULL,
        args_redacted_json TEXT NOT NULL,
        reasons_json TEXT NOT NULL,
        decided_at TEXT
      );
    `);
  }

  create(input: {
    id: string;
    server: string;
    tool: string;
    argsRedacted: Record<string, unknown>;
    reasons: string[];
    ttlSeconds: number;
  }): ApprovalRecord {
    const created = new Date();
    const expires = new Date(created.getTime() + input.ttlSeconds * 1000);
    const row: ApprovalRecord = {
      id: input.id,
      created_at: created.toISOString(),
      expires_at: expires.toISOString(),
      status: "pending",
      server: input.server,
      tool: input.tool,
      args_redacted_json: JSON.stringify(input.argsRedacted),
      reasons_json: JSON.stringify(input.reasons),
      decided_at: null,
    };
    this.db
      .prepare(
        `INSERT INTO approvals (
          id, created_at, expires_at, status, server, tool,
          args_redacted_json, reasons_json, decided_at
        ) VALUES (
          @id, @created_at, @expires_at, @status, @server, @tool,
          @args_redacted_json, @reasons_json, @decided_at
        )`,
      )
      .run(row);
    return row;
  }

  listPending(limit = 50): ApprovalRecord[] {
    this.expireOverdue();
    return this.db
      .prepare(
        `SELECT * FROM approvals WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
      )
      .all(limit) as ApprovalRecord[];
  }

  get(id: string): ApprovalRecord | undefined {
    this.expireOverdue();
    return this.db
      .prepare(`SELECT * FROM approvals WHERE id = ?`)
      .get(id) as ApprovalRecord | undefined;
  }

  decide(id: string, allow: boolean): ApprovalRecord | undefined {
    this.expireOverdue();
    const current = this.get(id);
    if (!current || current.status !== "pending") return current;
    const status: ApprovalStatus = allow ? "approved" : "denied";
    this.db
      .prepare(
        `UPDATE approvals SET status = ?, decided_at = ? WHERE id = ? AND status = 'pending'`,
      )
      .run(status, new Date().toISOString(), id);
    return this.get(id);
  }

  /** 轮询等待批准；超时或拒绝则返回最终状态 */
  async waitUntilDecided(
    id: string,
    pollMs = 250,
  ): Promise<ApprovalRecord> {
    for (;;) {
      const row = this.get(id);
      if (!row) {
        throw new Error(`approval not found: ${id}`);
      }
      if (row.status !== "pending") return row;
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }

  expireOverdue(): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE approvals
         SET status = 'expired', decided_at = ?
         WHERE status = 'pending' AND expires_at <= ?`,
      )
      .run(now, now);
  }

  close(): void {
    this.db.close();
  }
}
