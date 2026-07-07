import { randomBytes } from 'crypto'
import type Database from 'better-sqlite3'

export function generateId(): string {
  return randomBytes(4).toString('hex').slice(0, 6)
}

export function generateUniqueId(db: Database.Database): string {
  const stmt = db.prepare('SELECT id FROM codes WHERE id = ?')
  let id: string
  do {
    id = generateId()
  } while (stmt.get(id) != null)
  return id
}
