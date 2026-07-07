import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildApp } from '../src/app.js'
import type { FastifyInstance } from 'fastify'
import { closeDb } from '../src/db/index.js'

describe('Admin auth', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:'
    process.env.ADMIN_PASSWORD = 'secret123'
    process.env.NODE_ENV = 'test'
    app = buildApp()
    await app.ready()
  })

  afterEach(async () => {
    closeDb()
    await app.close()
  })

  it('GET /admin/codes without session redirects to /admin/login', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/codes' })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toContain('/admin/login')
  })

  it('POST /admin/login with correct password creates session and redirects', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { password: 'secret123' },
    })
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toContain('/admin')
    const setCookie = res.headers['set-cookie']
    expect(setCookie).toBeDefined()
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie
    expect(cookieHeader).toMatch(/Max-Age=7200|Expires=/)
  })

  it('POST /admin/logout destroys session and redirects to login', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { password: 'secret123' },
    })
    const cookie = loginRes.headers['set-cookie']
    expect(cookie).toBeDefined()

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/admin/logout',
      headers: { cookie: Array.isArray(cookie) ? cookie[0] : cookie },
    })
    expect(logoutRes.statusCode).toBe(302)
    expect(logoutRes.headers.location).toContain('/admin/login')

    const codesRes = await app.inject({
      method: 'GET',
      url: '/admin/codes',
      headers: { cookie: Array.isArray(cookie) ? cookie[0] : cookie },
    })
    expect(codesRes.statusCode).toBe(302)
    expect(codesRes.headers.location).toContain('/admin/login')
  })

  it('rejects expired admin session after 2 hours', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { password: 'secret123' },
    })
    const cookie = loginRes.headers['set-cookie']
    expect(cookie).toBeDefined()

    const twoHoursAndOneMs = 2 * 60 * 60 * 1000 + 1
    const originalNow = Date.now
    Date.now = () => originalNow() + twoHoursAndOneMs

    try {
      const codesRes = await app.inject({
        method: 'GET',
        url: '/admin/codes',
        headers: { cookie: Array.isArray(cookie) ? cookie[0] : cookie },
      })
      expect(codesRes.statusCode).toBe(302)
      expect(codesRes.headers.location).toContain('/admin/login')
    } finally {
      Date.now = originalNow
    }
  })

  it('POST /admin/login with wrong password returns 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { password: 'wrong' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('app does not throw when ADMIN_PASSWORD is set', () => {
    process.env.ADMIN_PASSWORD = 'test-pass'
    expect(() => buildApp()).not.toThrow()
  })
})
