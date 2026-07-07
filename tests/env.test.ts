import { describe, it, expect, afterEach } from 'vitest'
import { validateEnv } from '../src/utils/env.js'

const REQUIRED_VARS = {
  ADMIN_PASSWORD: 'secret',
  BASE_URL: 'https://example.com',
}

afterEach(() => {
  // clean up env vars set in tests
  Object.keys(REQUIRED_VARS).forEach(k => delete process.env[k])
  delete process.env.SESSION_SECRET
})

describe('validateEnv', () => {
  it('passes when all required vars are set', () => {
    Object.assign(process.env, REQUIRED_VARS)
    expect(() => validateEnv()).not.toThrow()
  })

  it('throws with list of missing vars', () => {
    expect(() => validateEnv()).toThrow(/Missing required environment variables/)
  })
})
