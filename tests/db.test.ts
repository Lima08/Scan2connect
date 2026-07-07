import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getDb, closeDb } from '../src/db/index.js'
import { runMigrations } from '../src/db/migrations.js'

beforeEach(() => {
  process.env.DB_PATH = ':memory:'
})

afterEach(() => {
  closeDb()
})

describe('migrations', () => {
  it('idempotent: running twice does not throw', () => {
    runMigrations()
    expect(() => runMigrations()).not.toThrow()
  })

  it('insert/select roundtrip on codes table', () => {
    runMigrations()
    const db = getDb()
    db.prepare("INSERT INTO codes (id) VALUES ('abc123')").run()
    const row = db.prepare("SELECT * FROM codes WHERE id = 'abc123'").get() as any
    expect(row.id).toBe('abc123')
    expect(row.scan_count).toBe(0)
    expect(row.linkedin_url).toBeNull()
  })
})
