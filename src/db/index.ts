import { mkdirSync } from 'fs'
import { dirname } from 'path'
import Database from 'better-sqlite3'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const path = process.env.DB_PATH ?? './data.db'
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true })
    }
    db = new Database(path)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function closeDb(): void {
  if (db) { db.close(); db = null }
}
