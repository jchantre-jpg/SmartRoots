import Constants from 'expo-constants';

const SR_WEB_PATH = '/app/index.html';

/** Host de Metro (solo referencia; la web se sirve desde Flask /app/). */
export function getMetroPackagerHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const m = String(hostUri).match(/^(?:exp|http)s?:\/\/([^/]+)/i);
    if (m?.[1]) return m[1];
    if (hostUri.includes(':') && !hostUri.includes('://')) return hostUri.split('/')[0];
  }
  const dh =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    Constants.manifest?.debuggerHost;
  if (dh) return String(dh).split('/')[0];
  return null;
}

export function isExpoMetroRootUrl(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `http://${url}`);
    const path = u.pathname.replace(/\/$/, '') || '';
    if (path !== '' && path !== '/') return false;
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    return port === '8081' || port === '8082' || port === '19000' || port === '19001';
  } catch {
    return false;
  }
}

export function isSmartRootsWebUrl(url) {
  if (!url) return false;
  return /\/app\/|\/sr-web\/|index\.html|5173/.test(url);
}

/** URL de la web en el mismo backend que /api (LAN o túnel). */
export function resolveFlaskWebUri(apiBase) {
  const base = String(apiBase || '').trim().replace(/\/$/, '');
  if (!base) return null;
  return `${base}${SR_WEB_PATH}`;
}

export function normalizeWebAppUri(uri, apiBase) {
  if (uri && isExpoMetroRootUrl(uri)) {
    return resolveFlaskWebUri(apiBase) || resolveMetroWebUri();
  }
  if (uri && (uri.includes('/sr-web/') || isExpoMetroRootUrl(uri))) {
    return resolveFlaskWebUri(apiBase) || normalizeWebAppUri(null, apiBase);
  }
  if (uri && isSmartRootsWebUrl(uri) && !uri.includes('/app/')) {
    return resolveFlaskWebUri(apiBase) || uri;
  }
  if (uri) {
    try {
      const u = new URL(uri.startsWith('http') ? uri : `http://${uri}`);
      return u.href;
    } catch {
      return uri;
    }
  }
  return resolveFlaskWebUri(apiBase);
}

/** @deprecated Metro no sirve HTML en Expo 54; usar Flask /app/ */
export function resolveMetroWebUri() {
  const host = getMetroPackagerHost();
  if (!host) return null;
  return `http://${host}/sr-web/index.html`;
}

export async function resolveWebAppUri({ apiBase }) {
  const fromFlask = resolveFlaskWebUri(apiBase);
  if (fromFlask) return fromFlask;
  return null;
}
