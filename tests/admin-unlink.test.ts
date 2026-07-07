import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildApp } from '../src/app.js'
import type { FastifyInstance } from 'fastify'
import { getDb, closeDb } from '../src/db/index.js'

async function loginAndGetCookie(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/admin/login',
    payload: { password: 'secret123' },
  })
  const cookie = res.headers['set-cookie']
  return Array.isArray(cookie) ? cookie[0] : cookie ?? ''
}

describe('POST /admin/codes/:id/unlink', () => {
  let app: FastifyInstance
  let cookie: string

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:'
    process.env.ADMIN_PASSWORD = 'secret123'
    process.env.NODE_ENV = 'test'
    app = buildApp()
    await app.ready()
    cookie = await loginAndGetCookie(app)
    const db = getDb()
    db.prepare("INSERT INTO codes (id, linkedin_url, scan_count) VALUES ('linked01', 'https://linkedin.com/in/test', 5)").run()
    db.prepare("INSERT INTO codes (id) VALUES ('unlinked01')").run()
  })

  afterEach(async () => {
    closeDb()
    await app.close()
  })

  it('unlinks code and preserves scan_count', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/codes/linked01/unlink', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    const row = getDb().prepare("SELECT linkedin_url, linked_at, scan_count FROM codes WHERE id = 'linked01'").get() as any
    expect(row.linkedin_url).toBeNull()
    expect(row.linked_at).toBeNull()
    expect(row.scan_count).toBe(5)
  })

  it('409 for already unlinked code', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/codes/unlinked01/unlink', headers: { cookie } })
    expect(res.statusCode).toBe(409)
  })

  it('404 for unknown code', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/codes/notexist/unlink', headers: { cookie } })
    expect(res.statusCode).toBe(404)
  })
})
