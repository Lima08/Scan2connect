import { extractLinkedInProfileSlug } from '../utils/urlValidator.js'

export type VerifyResult =
  | { status: 'found'; url: string }
  | { status: 'not_found' }
  | { status: 'error' }

const LINKEDIN_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const USERNAME_PATTERN = /^[a-zA-Z0-9-_%]+$/

// LinkedIn often blocks server-side checks with anti-bot status codes.
const LINKEDIN_BLOCKED_STATUSES = new Set([403, 429, 999])

export function buildLinkedInProfileUrl(username: string): string {
  return `https://www.linkedin.com/in/${username}`
}

export function normalizeUsername(raw: string): string {
  const trimmed = raw.trim().replace(/^@/, '').replace(/\/+$/, '')
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) {
    const slug = extractLinkedInProfileSlug(trimmed)
    if (slug) return slug.toLowerCase()
  }

  const pathMatch = trimmed.match(/^\/in\/([^/?#]+)/i)
  if (pathMatch) return pathMatch[1].toLowerCase()

  if (/linkedin\.com/i.test(trimmed)) {
    const slug = extractLinkedInProfileSlug(`https://${trimmed.replace(/^\/+/, '')}`)
    if (slug) return slug.toLowerCase()
  }

  return trimmed.toLowerCase()
}

export async function verifyLinkedInUsername(username: string): Promise<VerifyResult> {
  const clean = normalizeUsername(username)
  if (!clean || !USERNAME_PATTERN.test(clean)) return { status: 'not_found' }

  const url = buildLinkedInProfileUrl(clean)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'manual',
      headers: { 'User-Agent': LINKEDIN_UA, Accept: 'text/html' },
    })
    clearTimeout(timer)

    // 200 = perfil público; 302 = existe mas exige login (perfil privado ou redirect)
    if (res.status === 200 || res.status === 302 || res.status === 301) {
      return { status: 'found', url }
    }
    if (res.status === 404) return { status: 'not_found' }
    if (LINKEDIN_BLOCKED_STATUSES.has(res.status)) {
      return { status: 'found', url }
    }
    return { status: 'error' }
  } catch {
    clearTimeout(timer)
    return { status: 'error' }
  }
}
