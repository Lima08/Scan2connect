import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

describe('smoke', () => {
  it('GET /health returns 200', async () => {
    const app = buildApp()
    await app.ready()
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toMatchObject({ status: 'ok' })
  })
})
