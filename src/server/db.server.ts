import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

function resolveDbPath(): string {
  const override = process.env.BINGO_DB_PATH;
  if (override) return override;
  return path.join(process.cwd(), "data", "clubingo.db");
}

export function nowIso(): string {
  return new Date().toISOString();
}

const dbPath = resolveDbPath();
mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS bingo_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    drawn TEXT NOT NULL DEFAULT '[]',
    last_num INTEGER,
    updated_at TEXT NOT NULL
  );
`);

db.prepare(
  `INSERT OR IGNORE INTO bingo_state (id, drawn, last_num, updated_at) VALUES (1, '[]', NULL, ?)`,
).run(nowIso());

export function getDb(): Database.Database {
  return db;
}
