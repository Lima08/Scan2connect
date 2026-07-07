import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { buildApp } from '../src/app.js'
import type { FastifyInstance } from 'fastify'
import { getDb, closeDb } from '../src/db/index.js'
import * as linkedinVerify from '../src/services/linkedinVerify.js'

describe('POST /:short_id', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:'
    app = buildApp()
    await app.ready()
    const db = getDb()
    db.prepare("INSERT INTO codes (id) VALUES ('code01')").run()
    db.prepare("INSERT INTO codes (id, linkedin_url) VALUES ('linked01', 'https://linkedin.com/in/existing')").run()
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    closeDb()
    await app.close()
  })

  it('200 and persists normalized URL on valid submission', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/code01',
      payload: { linkedin_url: 'https://www.linkedin.com/in/johndoe?utm_source=share' },
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toMatchObject({ success: true })
    const row = getDb().prepare("SELECT linkedin_url, linked_at FROM codes WHERE id = 'code01'").get() as any
    expect(row.linkedin_url).toBe('https://www.linkedin.com/in/johndoe')
    expect(row.linked_at).not.toBeNull()
  })

  it('200 and persists profile URL when username is submitted', async () => {
    vi.spyOn(linkedinVerify, 'verifyLinkedInUsername').mockResolvedValue({
      status: 'found',
      url: 'https://www.linkedin.com/in/joao-paulo-gomes-lima-008',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/code01',
      payload: { linkedin_username: 'joao-paulo-gomes-lima-008' },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toMatchObject({
      success: true,
      url: 'https://www.linkedin.com/in/joao-paulo-gomes-lima-008',
      name: 'joao-paulo-gomes-lima-008',
    })

    const row = getDb().prepare("SELECT linkedin_url FROM codes WHERE id = 'code01'").get() as any
    expect(row.linkedin_url).toBe('https://www.linkedin.com/in/joao-paulo-gomes-lima-008')
  })

  it('422 for non-LinkedIn URL', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/code01',
      payload: { linkedin_url: 'https://facebook.com/johndoe' },
    })
    expect(res.statusCode).toBe(422)
  })

  it('422 for missing URL', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/code01',
      payload: {},
    })
    expect(res.statusCode).toBe(422)
  })

  it('409 for already linked code', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/linked01',
      payload: { linkedin_url: 'https://linkedin.com/in/another' },
    })
    expect(res.statusCode).toBe(409)
  })

  it('404 for unknown short_id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/notexist',
      payload: { linkedin_url: 'https://linkedin.com/in/someone' },
    })
    expect(res.statusCode).toBe(404)
  })
})
