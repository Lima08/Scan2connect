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

describe('GET /admin/codes/export', () => {
  let app: FastifyInstance
  let cookie: string

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:'
    process.env.ADMIN_PASSWORD = 'secret123'
    process.env.BASE_URL = 'http://localhost:3000'
    process.env.NODE_ENV = 'test'
    app = buildApp()
    await app.ready()
    cookie = await loginAndGetCookie(app)

    const db = getDb()
    db.prepare("INSERT INTO codes (id, linkedin_url, scan_count, linked_at) VALUES ('a1', 'https://linkedin.com/in/a', 3, datetime('now'))").run()
    db.prepare("INSERT INTO codes (id) VALUES ('b2')").run()
    db.prepare("INSERT INTO codes (id) VALUES ('c3')").run()
  })

  afterEach(async () => {
    closeDb()
    await app.close()
  })

  it('exports CSV with header and all codes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/codes/export?format=csv&status=all',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('codes-all')
    const lines = res.body.split('\n')
    expect(lines[0]).toBe('id,qr_url,status,linkedin_url,scan_count,created_at,linked_at')
    expect(lines).toHaveLength(4)
    expect(lines[1]).toContain('a1')
    expect(lines[1]).toContain('http://localhost:3000/a1')
    expect(lines[1]).toContain('linked')
  })

  it('exports CSV filtered by linked status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/codes/export?format=csv&status=linked',
      headers: { cookie },
    })
    const lines = res.body.split('\n').filter(Boolean)
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('a1')
  })

  it('exports CSV filtered by unlinked status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/codes/export?format=csv&status=unlinked',
      headers: { cookie },
    })
    const lines = res.body.split('\n').filter(Boolean)
    expect(lines).toHaveLength(3)
    expect(lines.some((line) => line.startsWith('b2,'))).toBe(true)
    expect(lines.some((line) => line.startsWith('c3,'))).toBe(true)
  })

  it('exports ZIP with PNG files', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/codes/export?format=zip&status=all',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('application/zip')
    expect(res.headers['content-disposition']).toContain('qrs-all')
    const buf = res.rawPayload
    expect(buf.length).toBeGreaterThan(0)
    expect(buf[0]).toBe(0x50)
    expect(buf[1]).toBe(0x4b)
  })

  it('redirects to login without session', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/codes/export?format=csv',
    })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toContain('/admin/login')
  })

  it('422 for invalid format', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/codes/export?format=pdf',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(422)
  })

  it('422 for ZIP export above 1000 codes', async () => {
    const db = getDb()
    const insert = db.prepare('INSERT INTO codes (id) VALUES (?)')
    const insertMany = db.transaction(() => {
      for (let i = 0; i < 1001; i++) {
        insert.run(`bulk${i}`)
      }
    })
    insertMany()

    const res = await app.inject({
      method: 'GET',
      url: '/admin/codes/export?format=zip&status=all',
      headers: { cookie },
    })
    expect(res.statusCode).toBe(422)
    expect(JSON.parse(res.body).error).toContain('1000')
  })
})
