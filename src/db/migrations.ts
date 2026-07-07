import { getDb } from './index.js'

export function runMigrations(): void {
  const db = getDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      date       TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS codes (
      id           TEXT PRIMARY KEY,
      linkedin_url TEXT,
      created_at   TEXT DEFAULT (datetime('now')),
      linked_at    TEXT,
      event_id     TEXT,
      scan_count   INTEGER DEFAULT 0
    );
  `)
}
