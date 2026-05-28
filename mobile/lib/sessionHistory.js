import AsyncStorage from '@react-native-async-storage/async-storage';

const ROOTS = 'smartroots.session.roots.v1';
const ROOTS_HIST = 'smartroots.session.roots.history.v1';
const POLY = 'smartroots.session.poly.v1';
const POLY_HIST = 'smartroots.session.poly.history.v1';
const INTERP = 'smartroots.session.interp.v1';
const INTERP_HIST = 'smartroots.session.interp.history.v1';

async function safeParse(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function safeSet(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export async function readRootsSession() {
  return safeParse(ROOTS, null);
}
export async function writeRootsSession(payload) {
  await safeSet(ROOTS, payload);
}
export async function pushRootsHistory(entry) {
  const prev = await safeParse(ROOTS_HIST, []);
  const next = [{ ...entry, at: Date.now() }, ...prev.filter((e) => e.expr !== entry.expr)].slice(0, 12);
  await safeSet(ROOTS_HIST, next);
}
export async function readRootsHistory() {
  return safeParse(ROOTS_HIST, []);
}

export async function readPolySession() {
  return safeParse(POLY, null);
}
export async function writePolySession(payload) {
  await safeSet(POLY, payload);
}
export async function pushPolyHistory(entry) {
  const prev = await safeParse(POLY_HIST, []);
  const next = [{ ...entry, at: Date.now() }, ...prev.filter((e) => e.coeffs !== entry.coeffs)].slice(0, 12);
  await safeSet(POLY_HIST, next);
}
export async function readPolyHistory() {
  return safeParse(POLY_HIST, []);
}

export async function readInterpSession() {
  return safeParse(INTERP, null);
}
export async function writeInterpSession(payload) {
  await safeSet(INTERP, payload);
}
export async function pushInterpHistory(entry) {
  const prev = await safeParse(INTERP_HIST, []);
  const key = `${entry.nodesX}|${entry.nodesY}`;
  const next = [{ ...entry, at: Date.now() }, ...prev.filter((e) => `${e.nodesX}|${e.nodesY}` !== key)].slice(0, 12);
  await safeSet(INTERP_HIST, next);
}
export async function readInterpHistory() {
  return safeParse(INTERP_HIST, []);
}
