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

describe('GET /admin/codes/:id/qr', () => {
  let app: FastifyInstance
  let cookie: string

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:'
    process.env.ADMIN_PASSWORD = 'secret123'
    process.env.NODE_ENV = 'test'
    process.env.BASE_URL = 'http://localhost:3000'
    app = buildApp()
    await app.ready()
    cookie = await loginAndGetCookie(app)
    getDb().prepare("INSERT INTO codes (id) VALUES ('qr001')").run()
  })

  afterEach(async () => {
    closeDb()
    await app.close()
  })

  it('returns valid PNG (magic bytes \\x89PNG)', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes/qr001/qr', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('image/png')
    const buf = Buffer.from(res.rawPayload)
    // PNG magic bytes: 89 50 4E 47
    expect(buf[0]).toBe(0x89)
    expect(buf[1]).toBe(0x50)
    expect(buf[2]).toBe(0x4E)
    expect(buf[3]).toBe(0x47)
  })

  it('404 for unknown code id', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes/notexist/qr', headers: { cookie } })
    expect(res.statusCode).toBe(404)
  })
})
