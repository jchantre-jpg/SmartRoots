/**
 * Persistencia ligera en `localStorage`: borradores y mini-historial por módulo (raíces, polinomios, interpolación).
 * Evita perder trabajo al recargar; no sustituye autenticación ni servidor.
 */
const ROOTS = 'smartroots.session.roots.v1'
const ROOTS_HIST = 'smartroots.session.roots.history.v1'
const POLY = 'smartroots.session.poly.v1'
const POLY_HIST = 'smartroots.session.poly.history.v1'
const INTERP = 'smartroots.session.interp.v1'
const INTERP_HIST = 'smartroots.session.interp.history.v1'

function safeParse(json, fallback) {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

export function readRootsSession() {
  return safeParse(localStorage.getItem(ROOTS) || '', null)
}

export function writeRootsSession(payload) {
  try {
    localStorage.setItem(ROOTS, JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
}

export function pushRootsHistory(entry) {
  try {
    const prev = safeParse(localStorage.getItem(ROOTS_HIST) || '[]', [])
    const next = [{ ...entry, at: Date.now() }, ...prev.filter((e) => e.expr !== entry.expr)].slice(0, 12)
    localStorage.setItem(ROOTS_HIST, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function readRootsHistory() {
  return safeParse(localStorage.getItem(ROOTS_HIST) || '[]', [])
}

export function readPolySession() {
  return safeParse(localStorage.getItem(POLY) || '', null)
}

export function writePolySession(payload) {
  try {
    localStorage.setItem(POLY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export function pushPolyHistory(entry) {
  try {
    const prev = safeParse(localStorage.getItem(POLY_HIST) || '[]', [])
    const next = [{ ...entry, at: Date.now() }, ...prev.filter((e) => e.coeffs !== entry.coeffs)].slice(0, 12)
    localStorage.setItem(POLY_HIST, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function readPolyHistory() {
  return safeParse(localStorage.getItem(POLY_HIST) || '[]', [])
}

export function readInterpSession() {
  return safeParse(localStorage.getItem(INTERP) || '', null)
}

export function writeInterpSession(payload) {
  try {
    localStorage.setItem(INTERP, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export function pushInterpHistory(entry) {
  try {
    const prev = safeParse(localStorage.getItem(INTERP_HIST) || '[]', [])
    const key = `${entry.nodesX}|${entry.nodesY}`
    const next = [{ ...entry, at: Date.now() }, ...prev.filter((e) => `${e.nodesX}|${e.nodesY}` !== key)].slice(0, 12)
    localStorage.setItem(INTERP_HIST, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function readInterpHistory() {
  return safeParse(localStorage.getItem(INTERP_HIST) || '[]', [])
}
