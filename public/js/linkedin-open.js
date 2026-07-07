(function (global) {
  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent)
  }

  function isValidLinkedInUrl(url) {
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname.toLowerCase()
      return hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')
    } catch {
      return false
    }
  }

  function extractProfileSlug(url) {
    try {
      const parsed = new URL(url)
      const match = parsed.pathname.match(/^\/in\/([^/?#]+)/i)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  function normalizeWebUrl(url) {
    if (!isValidLinkedInUrl(url)) return null
    const parsed = new URL(url)
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')
    return parsed.toString()
  }

  function buildOpenUrl(webUrl) {
    const normalized = normalizeWebUrl(webUrl)
    if (!normalized) return null

    if (isAndroid()) {
      const parsed = new URL(normalized)
      const path = parsed.pathname + parsed.search
      const fallback = encodeURIComponent(normalized)
      return (
        'intent://www.linkedin.com' +
        path +
        '#Intent;scheme=https;package=com.linkedin.android;S.browser_fallback_url=' +
        fallback +
        ';end'
      )
    }

    return normalized
  }

  function openLinkedIn(webUrl) {
    const target = buildOpenUrl(webUrl)
    if (target) window.location.href = target
  }

  function openLinkedInWeb(webUrl) {
    const normalized = normalizeWebUrl(webUrl)
    if (normalized) window.location.href = normalized
  }

  global.LinkedInOpen = {
    isMobile,
    isAndroid,
    isValidLinkedInUrl,
    extractProfileSlug,
    buildOpenUrl,
    openLinkedIn,
    openLinkedInWeb,
  }
})(window)
