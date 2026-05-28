/**
 * Cliente HTTP hacia la API Flask.
 * - En desarrollo: rutas relativas ``/api`` (proxy Vite → puerto 5000).
 * - En producción: opcional ``import.meta.env.VITE_API_BASE`` con URL absoluta del backend.
 * - En shell móvil (WebView): ``window.__SMARTROOTS__.apiBase`` inyectado por React Native.
 */
import {
  isMobileShell,
  notifyMobileAuth,
  resolveApiBase,
} from './mobileBridge.js'
import { isPublicTunnelUrl, tunnelHeadersForUrl } from './tunnelHeaders.js'

/** Token Bearer para /api/auth/me y futuras rutas protegidas. */
const AUTH_TOKEN_KEY = 'smartroots.auth.token.v1'

const FETCH_TIMEOUT_MS = 45000

// --- Token en localStorage (sesión “Bearer” sin cookies) ---

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredAuthToken(token) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  else window.localStorage.removeItem(AUTH_TOKEN_KEY)
  notifyMobileAuth(token)
}

function buildHeaders(extra, includeAuth, requestUrl) {
  const headers = { ...extra, ...tunnelHeadersForUrl(requestUrl) }
  if (includeAuth && typeof window !== 'undefined') {
    const t = window.localStorage.getItem(AUTH_TOKEN_KEY)
    if (t) headers.Authorization = `Bearer ${t}`
  }
  return headers
}

function apiUrl(path) {
  const base = resolveApiBase()
  if (base) return `${base}${path}`
  return path
}

/** Traduce fallos de red del navegador a un mensaje con instrucciones para levantar Flask. */
function friendlyNetworkError(err) {
  const msg = err?.message || String(err)
  const base = resolveApiBase()
  const tunnelHint = isMobileShell()
    ? isPublicTunnelUrl(base)
      ? 'Comprueba npm run tunnel:backend en el PC y que python app.py esté activo.'
      : 'Sin WiFi: en el PC ejecuta npm run tunnel:backend, copia la URL https en Red → Backend y Guardar. O usa la IP local en la misma red.'
    : 'Comprueba que el backend Flask esté en marcha (python app.py).'

  if (err?.name === 'AbortError' || /aborted|timeout/i.test(msg)) {
    return new Error(
      isMobileShell()
        ? `Tiempo de espera agotado. ${tunnelHint}`
        : 'Tiempo de espera agotado. Comprueba que el backend Flask esté en marcha (python app.py).',
    )
  }
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return new Error(
      isMobileShell()
        ? `No hay conexión con el backend. ${tunnelHint}`
        : 'No hay conexión con el servidor. En otra terminal: cd SmartRoots/backend → python app.py',
    )
  }
  return err instanceof Error ? err : new Error(String(err))
}

/** Evita que un `fetch` rechazado pierda el contexto (p. ej. CORS o servidor apagado). */
async function safeFetch(input, init) {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(input, { ...init, signal: ctrl.signal })
  } catch (e) {
    throw friendlyNetworkError(e)
  } finally {
    window.clearTimeout(timer)
  }
}

/** Interpreta cuerpo JSON o HTML de error sin romper si el servidor devuelve texto plano. */
async function parseJsonResponse(res) {
  const text = await res.text()
  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (!text) return {}
  const looksJson = text.trimStart().startsWith('{') || text.trimStart().startsWith('[')
  if (!ct.includes('application/json') && !looksJson) {
    if (!res.ok) throw new Error(text.slice(0, 240).trim() || res.statusText)
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    if (!res.ok) throw new Error(text.slice(0, 200).trim() || `${res.status} ${res.statusText}`)
    return {}
  }
}

/** POST JSON; por defecto adjunta Authorization si hay token guardado. */
export async function apiPost(path, body, options = {}) {
  const { includeAuth = true } = options
  const url = apiUrl(path)
  if (isMobileShell() && !resolveApiBase()) {
    throw new Error(
      'Backend no configurado. En el PC: npm run tunnel:backend (en mobile/) → copia la URL https en Red → Guardar.',
    )
  }
  const res = await safeFetch(url, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }, includeAuth, url),
    body: JSON.stringify(body),
  })
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw apiErrorFromPayload(data, res)
  }
  if (data && data.ok === false && data.error) {
    throw apiErrorFromPayload(data, res)
  }
  return data
}

/** GET; por defecto incluye Bearer si existe token (p. ej. `/api/auth/me`). */
export async function apiGet(path, options = {}) {
  const { includeAuth = true } = options
  const url = apiUrl(path)
  const res = await safeFetch(url, {
    headers: buildHeaders({}, includeAuth, url),
  })
  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw apiErrorFromPayload(data, res)
  }
  if (data && data.ok === false && data.error) {
    throw apiErrorFromPayload(data, res)
  }
  return data
}

function apiErrorFromPayload(data, res) {
  const errMsg = data?.error || res.statusText || 'Error del servidor'
  const hints = Array.isArray(data?.hints) ? data.hints.filter(Boolean) : []
  const full =
    hints.length > 0 ? `${errMsg}\n\n${hints.map((h) => `• ${h}`).join('\n')}` : errMsg
  const err = new Error(full)
  err.hints = hints
  err.serverError = errMsg
  return err
}
