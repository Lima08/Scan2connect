export interface ValidationResult {
  valid: boolean
  normalized: string
}

export function validateLinkedInUrl(raw: string): ValidationResult {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { valid: false, normalized: '' }
  }

  const hostname = url.hostname.toLowerCase()
  const isLinkedIn = hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')
  if (!isLinkedIn) return { valid: false, normalized: '' }

  // Remove UTM and tracking query params
  const cleanParams = new URLSearchParams()
  for (const [key, value] of url.searchParams) {
    if (!key.startsWith('utm_') && key !== 'trk' && key !== 'trackingId') {
      cleanParams.set(key, value)
    }
  }

  const normalized =
    url.origin +
    url.pathname.replace(/\/+$/, '') +
    (cleanParams.toString() ? `?${cleanParams}` : '')

  return { valid: true, normalized }
}

export function extractLinkedInProfileSlug(raw: string): string | null {
  try {
    const url = new URL(raw)
    const hostname = url.hostname.toLowerCase()
    const isLinkedIn = hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')
    if (!isLinkedIn) return null

    const match = url.pathname.match(/^\/in\/([^/?#]+)/i)
    return match ? match[1] : null
  } catch {
    return null
  }
}
