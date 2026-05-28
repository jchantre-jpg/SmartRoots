/**
 * Puente SmartRoots web ↔ shell React Native (WebView).
 * La shell inyecta `window.__SMARTROOTS__` antes de cargar el bundle.
 */
export function getMobileConfig() {
  if (typeof window === 'undefined') return null
  const cfg = window.__SMARTROOTS__
  return cfg && typeof cfg === 'object' ? cfg : null
}

export function isMobileShell() {
  return Boolean(getMobileConfig()?.isMobileShell)
}

const API_BASE_STORAGE_KEY = 'smartroots.mobile.apiBase.v1'

export function getInjectedApiBase() {
  const base = getMobileConfig()?.apiBase
  if (typeof base === 'string' && base.trim()) return base.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(API_BASE_STORAGE_KEY)
      if (stored?.trim()) return stored.trim().replace(/\/$/, '')
    } catch {
      /* ignore */
    }
  }
  return ''
}

/** URL del backend en cada petición (no solo al importar el módulo). */
export function resolveApiBase() {
  const injected = getInjectedApiBase()
  if (injected) return injected

  if (typeof window !== 'undefined' && window.location?.pathname?.startsWith('/app')) {
    return window.location.origin.replace(/\/$/, '')
  }

  const env = import.meta.env.VITE_API_BASE
  if (typeof env === 'string' && env.trim()) return env.trim().replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location
    if (protocol === 'http:' || protocol === 'https:') {
      if (port === '5173') return `${protocol}//${hostname}:5000`
      if (!port || port === '80' || port === '443') return `${protocol}//${hostname}:5000`
    }
  }
  return ''
}

export function persistInjectedApiBase(apiBase) {
  if (typeof window === 'undefined') return
  const b = (apiBase || '').trim().replace(/\/$/, '')
  try {
    if (b) window.localStorage.setItem(API_BASE_STORAGE_KEY, b)
    else window.localStorage.removeItem(API_BASE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  const cfg = getMobileConfig() || {}
  window.__SMARTROOTS__ = { ...cfg, isMobileShell: true, apiBase: b }
}

export function notifyMobileAuth(token) {
  if (!isMobileShell()) return
  const payload = JSON.stringify({ type: 'auth', token: token || null })
  if (window.ReactNativeWebView?.postMessage) {
    window.ReactNativeWebView.postMessage(payload)
  }
}

export function notifyMobileReady() {
  if (!isMobileShell()) return
  const payload = JSON.stringify({ type: 'ready' })
  if (window.ReactNativeWebView?.postMessage) {
    window.ReactNativeWebView.postMessage(payload)
  }
}
