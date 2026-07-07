import { describe, it, expect } from 'vitest'
import { isMobileUserAgent } from '../src/utils/userAgent.js'

describe('isMobileUserAgent', () => {
  it('detects Android', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (Linux; Android 14) Mobile Safari/537.36')).toBe(true)
  })

  it('detects iPhone', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile')).toBe(true)
  })

  it('detects iPad', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe(true)
  })

  it('returns false for desktop Chrome', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0')).toBe(false)
  })

  it('returns false for desktop Safari', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15')).toBe(false)
  })
})
