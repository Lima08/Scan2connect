import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { generateUniqueId } from '../src/utils/idGenerator.js'
import { validateLinkedInUrl, extractLinkedInProfileSlug } from '../src/utils/urlValidator.js'

describe('generateUniqueId', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`CREATE TABLE codes (id TEXT PRIMARY KEY, linkedin_url TEXT, created_at TEXT DEFAULT (datetime('now')), linked_at TEXT, event_id TEXT, scan_count INTEGER DEFAULT 0)`)
  })

  afterEach(() => { db.close() })

  it('returns a 6-char lowercase hex string', () => {
    const id = generateUniqueId(db)
    expect(id).toMatch(/^[0-9a-f]{6}$/)
  })

  it('returns unique id not present in db', () => {
    const id = generateUniqueId(db)
    db.prepare('INSERT INTO codes (id) VALUES (?)').run(id)
    const id2 = generateUniqueId(db)
    expect(id2).not.toBe(id)
  })
})

describe('validateLinkedInUrl', () => {
  it('accepts linkedin.com profile URL', () => {
    const result = validateLinkedInUrl('https://www.linkedin.com/in/johndoe')
    expect(result.valid).toBe(true)
    expect(result.normalized).toContain('linkedin.com/in/johndoe')
  })

  it('normalizes trailing slash', () => {
    const result = validateLinkedInUrl('https://linkedin.com/in/johndoe/')
    expect(result.valid).toBe(true)
    expect(result.normalized).not.toMatch(/\/$/)
  })

  it('removes UTM params', () => {
    const result = validateLinkedInUrl('https://www.linkedin.com/in/johndoe?utm_source=share&utm_medium=email')
    expect(result.valid).toBe(true)
    expect(result.normalized).not.toContain('utm_')
  })

  it('rejects non-linkedin URL', () => {
    const result = validateLinkedInUrl('https://facebook.com/johndoe')
    expect(result.valid).toBe(false)
  })

  it('rejects malformed URL', () => {
    const result = validateLinkedInUrl('not-a-url')
    expect(result.valid).toBe(false)
  })

  it('accepts subdomain linkedin URL (e.g. br.linkedin.com)', () => {
    const result = validateLinkedInUrl('https://br.linkedin.com/in/johndoe')
    expect(result.valid).toBe(true)
  })
})

describe('extractLinkedInProfileSlug', () => {
  it('extracts slug from profile URL', () => {
    expect(extractLinkedInProfileSlug('https://www.linkedin.com/in/johndoe')).toBe('johndoe')
  })

  it('extracts slug from URL with trailing slash', () => {
    expect(extractLinkedInProfileSlug('https://linkedin.com/in/johndoe/')).toBe('johndoe')
  })

  it('extracts slug from subdomain URL', () => {
    expect(extractLinkedInProfileSlug('https://br.linkedin.com/in/johndoe')).toBe('johndoe')
  })

  it('returns null for non-profile URL', () => {
    expect(extractLinkedInProfileSlug('https://www.linkedin.com/company/acme')).toBe(null)
  })

  it('returns null for non-linkedin URL', () => {
    expect(extractLinkedInProfileSlug('https://facebook.com/johndoe')).toBe(null)
  })

  it('returns null for malformed URL', () => {
    expect(extractLinkedInProfileSlug('not-a-url')).toBe(null)
  })
})
