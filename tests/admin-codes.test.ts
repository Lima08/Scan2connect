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

describe('GET /admin/codes', () => {
  let app: FastifyInstance
  let cookie: string

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:'
    process.env.ADMIN_PASSWORD = 'secret123'
    process.env.NODE_ENV = 'test'
    app = buildApp()
    await app.ready()
    cookie = await loginAndGetCookie(app)
    // seed data
    const db = getDb()
    db.prepare("INSERT INTO codes (id, linkedin_url, scan_count, linked_at) VALUES ('a1', 'https://linkedin.com/in/a', 3, datetime('now'))").run()
    db.prepare("INSERT INTO codes (id) VALUES ('b2')").run()
    db.prepare("INSERT INTO codes (id) VALUES ('c3')").run()
  })

  afterEach(async () => {
    closeDb()
    await app.close()
  })

  it('returns all codes with stats', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes', headers: { cookie } })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.stats.total).toBe(3)
    expect(body.stats.linked).toBe(1)
    expect(body.codes).toHaveLength(3)
  })

  it('filters by linked status', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes?status=linked', headers: { cookie } })
    const body = JSON.parse(res.body)
    expect(body.codes).toHaveLength(1)
    expect(body.codes[0].id).toBe('a1')
  })

  it('filters by unlinked status', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes?status=unlinked', headers: { cookie } })
    const body = JSON.parse(res.body)
    expect(body.codes).toHaveLength(2)
  })

  it('pagination works', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes?limit=2&page=1', headers: { cookie } })
    const body = JSON.parse(res.body)
    expect(body.codes).toHaveLength(2)
    expect(body.pagination.total).toBe(3)
  })

  it('includes linkedin_username for linked codes', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes', headers: { cookie } })
    const body = JSON.parse(res.body)
    const linked = body.codes.find((c: { id: string }) => c.id === 'a1')
    expect(linked.linkedin_username).toBe('a')
    const unlinked = body.codes.find((c: { id: string }) => c.id === 'b2')
    expect(unlinked.linkedin_username).toBeNull()
  })

  it('searches by code id', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes?q=a1', headers: { cookie } })
    const body = JSON.parse(res.body)
    expect(body.codes).toHaveLength(1)
    expect(body.codes[0].id).toBe('a1')
  })

  it('searches by linkedin username slug', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes?q=a', headers: { cookie } })
    const body = JSON.parse(res.body)
    expect(body.codes).toHaveLength(1)
    expect(body.codes[0].id).toBe('a1')
  })

  it('combines search with linked status filter', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes?status=linked&q=a', headers: { cookie } })
    const body = JSON.parse(res.body)
    expect(body.codes).toHaveLength(1)
    expect(body.codes[0].id).toBe('a1')
  })

  it('returns empty when search matches only unlinked under linked filter', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes?status=linked&q=b2', headers: { cookie } })
    const body = JSON.parse(res.body)
    expect(body.codes).toHaveLength(0)
  })
})
