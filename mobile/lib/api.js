/**
 * Cliente HTTP móvil — misma API que la web (`/api/*`).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tunnelHeadersForUrl } from './tunnelHeaders';

const AUTH_TOKEN_KEY = 'smartroots.auth.token.v1';

export async function getStoredAuthToken() {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredAuthToken(token) {
  try {
    if (token) await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    else await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function formatApiError(data, res) {
  const errMsg = data?.error || res?.statusText || 'Error del servidor';
  const hints = Array.isArray(data?.hints) ? data.hints.filter(Boolean) : [];
  if (hints.length > 0) {
    return `${errMsg}\n\n${hints.map((h) => `• ${h}`).join('\n')}`;
  }
  return errMsg;
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(text.slice(0, 200).trim() || `HTTP ${res.status}`);
    return {};
  }
}

async function buildHeaders(extra, includeAuth, requestUrl) {
  const headers = { ...extra, ...tunnelHeadersForUrl(requestUrl) };
  if (includeAuth) {
    const t = await getStoredAuthToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  return headers;
}

function normalizeBase(base) {
  return String(base || '').replace(/\/$/, '');
}

export async function apiPost(base, path, body, options = {}) {
  const { includeAuth = true } = options;
  const url = `${normalizeBase(base)}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: await buildHeaders({ 'Content-Type': 'application/json' }, includeAuth, url),
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(
      `Sin conexión con ${normalizeBase(base)}. ¿Flask activo? (python app.py en backend/)`,
    );
  }
  const data = await parseJsonResponse(res);
  if (!res.ok || (data && data.ok === false && data.error)) {
    throw new Error(formatApiError(data, res));
  }
  return data;
}

export async function apiGet(base, path, options = {}) {
  const { includeAuth = true } = options;
  const url = `${normalizeBase(base)}${path}`;
  let res;
  try {
    res = await fetch(url, { headers: await buildHeaders({}, includeAuth, url) });
  } catch {
    throw new Error(`Sin conexión con ${normalizeBase(base)}.`);
  }
  const data = await parseJsonResponse(res);
  if (!res.ok || (data && data.ok === false && data.error)) {
    throw new Error(formatApiError(data, res));
  }
  return data;
}

export async function checkHealth(base) {
  try {
    const data = await apiGet(base, '/api/health', { includeAuth: false });
    return data?.status === 'ok';
  } catch {
    return false;
  }
}
