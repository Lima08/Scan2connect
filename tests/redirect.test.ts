import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildApp } from '../src/app.js'
import type { FastifyInstance } from 'fastify'

describe('GET /:short_id', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:'
    app = buildApp()
    await app.ready()
  })

  afterEach(async () => {
    const { closeDb } = await import('../src/db/index.js')
    closeDb()
    await app.close()
  })

  it('302 to linkedin_url when code is linked on desktop', async () => {
    const { getDb } = await import('../src/db/index.js')
    const db = getDb()
    db.prepare("INSERT INTO codes (id, linkedin_url) VALUES ('abc123', 'https://linkedin.com/in/test')").run()
    const res = await app.inject({
      method: 'GET',
      url: '/abc123',
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
    })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe('https://linkedin.com/in/test')
  })

  it('302 to open.html when code is linked on mobile', async () => {
    const { getDb } = await import('../src/db/index.js')
    const db = getDb()
    const linkedinUrl = 'https://linkedin.com/in/test'
    db.prepare("INSERT INTO codes (id, linkedin_url) VALUES ('abc123', ?)").run(linkedinUrl)
    const res = await app.inject({
      method: 'GET',
      url: '/abc123',
      headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) Mobile Safari/537.36' },
    })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toBe(`/open.html?url=${encodeURIComponent(linkedinUrl)}`)
  })

  it('increments scan_count on mobile redirect', async () => {
    const { getDb } = await import('../src/db/index.js')
    const db = getDb()
    db.prepare("INSERT INTO codes (id, linkedin_url, scan_count) VALUES ('abc123', 'https://linkedin.com/in/test', 0)").run()
    await app.inject({
      method: 'GET',
      url: '/abc123',
      headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile' },
    })
    const row = db.prepare("SELECT scan_count FROM codes WHERE id = 'abc123'").get() as any
    expect(row.scan_count).toBe(1)
  })

  it('serves tela-busca-linkedin.html when code is unlinked', async () => {
    const { getDb } = await import('../src/db/index.js')
    const db = getDb()
    db.prepare("INSERT INTO codes (id) VALUES ('unlinked1')").run()
    const res = await app.inject({ method: 'GET', url: '/unlinked1' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
  })

  it('404 for unknown short_id', async () => {
    const res = await app.inject({ method: 'GET', url: '/notexist' })
    expect(res.statusCode).toBe(404)
  })

  it('serves success.html instead of treating it as a short_id', async () => {
    const res = await app.inject({ method: 'GET', url: '/success.html' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.body).toContain('Perfil vinculado')
  })
})
