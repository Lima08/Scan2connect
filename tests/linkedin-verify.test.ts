import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  normalizeUsername,
  verifyLinkedInUsername,
  buildLinkedInProfileUrl,
} from '../src/services/linkedinVerify.js'

describe('normalizeUsername', () => {
  it('normalizes plain username', () => {
    expect(normalizeUsername('joao-paulo-gomes-lima-008')).toBe('joao-paulo-gomes-lima-008')
  })

  it('strips @ prefix and trailing slash', () => {
    expect(normalizeUsername('@Joao-Silva/')).toBe('joao-silva')
  })

  it('extracts slug from full profile URL', () => {
    expect(normalizeUsername('https://www.linkedin.com/in/joao-paulo-gomes-lima-008')).toBe(
      'joao-paulo-gomes-lima-008'
    )
  })

  it('extracts slug from partial linkedin URL', () => {
    expect(normalizeUsername('linkedin.com/in/joao-paulo-gomes-lima-008')).toBe(
      'joao-paulo-gomes-lima-008'
    )
  })

  it('extracts slug from /in/ path', () => {
    expect(normalizeUsername('/in/joao-paulo-gomes-lima-008')).toBe('joao-paulo-gomes-lima-008')
  })
})

describe('buildLinkedInProfileUrl', () => {
  it('builds canonical profile URL', () => {
    expect(buildLinkedInProfileUrl('joao-paulo-gomes-lima-008')).toBe(
      'https://www.linkedin.com/in/joao-paulo-gomes-lima-008'
    )
  })
})

describe('verifyLinkedInUsername', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts username when LinkedIn blocks verification with 999', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 999,
        headers: { get: () => null },
      })
    )

    const result = await verifyLinkedInUsername('joao-paulo-gomes-lima-008')
    expect(result).toEqual({
      status: 'found',
      url: 'https://www.linkedin.com/in/joao-paulo-gomes-lima-008',
    })
  })

  it('returns not_found for explicit 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 404,
        headers: { get: () => null },
      })
    )

    const result = await verifyLinkedInUsername('joao-paulo-gomes-lima-008')
    expect(result).toEqual({ status: 'not_found' })
  })

  it('returns not_found for invalid username format', async () => {
    const result = await verifyLinkedInUsername('invalid user name')
    expect(result).toEqual({ status: 'not_found' })
  })
})
