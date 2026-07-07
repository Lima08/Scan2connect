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

describe('POST /admin/codes', () => {
  let app: FastifyInstance
  let cookie: string

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:'
    process.env.ADMIN_PASSWORD = 'secret123'
    process.env.NODE_ENV = 'test'
    app = buildApp()
    await app.ready()
    cookie = await loginAndGetCookie(app)
  })

  afterEach(async () => {
    closeDb()
    await app.close()
  })

  it('generates exactly N codes in the db', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/codes',
      payload: { count: 5 },
      headers: { cookie },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.ids).toHaveLength(5)
    const row = getDb().prepare('SELECT COUNT(*) as count FROM codes').get() as any
    expect(row.count).toBe(5)
  })

  it('count=1 generates exactly 1 code', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/codes',
      payload: { count: 1 },
      headers: { cookie },
    })
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).ids).toHaveLength(1)
  })

  it('422 for count > 1000', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/codes',
      payload: { count: 1001 },
      headers: { cookie },
    })
    expect(res.statusCode).toBe(422)
  })
})
