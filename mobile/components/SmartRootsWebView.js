import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { normalizeWebAppUri } from '../lib/bundledWeb';
import { AUTH_TOKEN_KEY, readAuthToken } from '../lib/smartrootsConfig';

const API_BASE_STORAGE_KEY = 'smartroots.mobile.apiBase.v1';

function buildInjectScript({ apiBase, authToken }) {
  const base = (apiBase || '').replace(/\/$/, '');
  const cfg = {
    isMobileShell: true,
    apiBase: base,
  };
  const cfgJson = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const tokenJson = JSON.stringify(authToken || '');
  const baseJson = JSON.stringify(base);
  return `
(function () {
  window.__SMARTROOTS__ = ${cfgJson};
  try {
    var b = ${baseJson};
    if (b) localStorage.setItem(${JSON.stringify(API_BASE_STORAGE_KEY)}, b);
    var k = ${JSON.stringify(AUTH_TOKEN_KEY)};
    var t = ${tokenJson};
    if (t) localStorage.setItem(k, t);
    else localStorage.removeItem(k);
  } catch (e) {}
})();
true;
`;
}

async function resolveWebViewSource(uri) {
  const normalized = normalizeWebAppUri(uri);
  if (!normalized) return null;

  if (normalized.startsWith('file://') || !normalized.startsWith('http')) {
    return { uri: normalized.startsWith('file://') ? normalized : `file://${normalized}` };
  }

  const needsFetch = normalized.includes('/app/') || normalized.includes('/sr-web/');

  if (!needsFetch) {
    return { uri: normalized };
  }

  try {
    const { tunnelHeadersForUrl } = await import('../lib/tunnelHeaders');
    const res = await fetch(normalized, {
      headers: { Accept: 'text/html', ...tunnelHeadersForUrl(normalized) },
    });
    const html = await res.text();
    if (html.trimStart().startsWith('<')) {
      const baseUrl = normalized.replace(/index\.html(?:\?.*)?$/i, '/').replace(/\/app\/?$/, '/app/');
      return { html, baseUrl };
    }
    if (html.trimStart().startsWith('{')) {
      throw new Error('Se cargó el manifiesto de Expo en lugar de la app. Reinicia Expo en mobile/.');
    }
  } catch (e) {
    return { uri: normalized, loadError: e.message || String(e) };
  }

  return { uri: normalized };
}

export function SmartRootsWebView({ uri, apiBase, reloadKey, onReady, onAuthChange, colors }) {
  const webRef = useRef(null);
  const [authToken, setAuthToken] = useState(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [webSource, setWebSource] = useState(null);
  const [sourceReady, setSourceReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await readAuthToken();
      if (!cancelled) {
        setAuthToken(t);
        setTokenReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setSourceReady(false);
    setWebSource(null);
    (async () => {
      const src = await resolveWebViewSource(uri);
      if (cancelled) return;
      if (src?.loadError) setLoadError(src.loadError);
      setWebSource(src);
      setSourceReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uri, reloadKey]);

  const injectBefore = useMemo(
    () => buildInjectScript({ apiBase, authToken }),
    [apiBase, authToken, reloadKey],
  );

  const onMessage = useCallback(
    async (ev) => {
      try {
        const msg = JSON.parse(ev.nativeEvent.data);
        if (msg.type === 'ready') {
          onReady?.();
          return;
        }
        if (msg.type === 'auth') {
          const { writeAuthToken } = await import('../lib/smartrootsConfig');
          await writeAuthToken(msg.token || null);
          setAuthToken(msg.token || null);
          onAuthChange?.(msg.token || null);
        }
      } catch {
        /* ignore */
      }
    },
    [onReady, onAuthChange],
  );

  if (!uri) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.muted, textAlign: 'center', padding: 16 }}>
          No se pudo cargar la interfaz web. Reinicia Expo (npm start en mobile/) y pulsa ↻.
        </Text>
      </View>
    );
  }

  if (!tokenReady || !sourceReady || !webSource) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.muted, marginTop: 12, fontSize: 12 }}>Cargando SmartRoots…</Text>
      </View>
    );
  }

  const source = webSource.html
    ? { html: webSource.html, baseUrl: webSource.baseUrl }
    : { uri: webSource.uri };

  return (
    <View style={styles.flex}>
      {loadError ? (
        <Text style={[styles.errorBanner, { color: '#fecaca', backgroundColor: '#7f1d1d' }]}>{loadError}</Text>
      ) : null}
      <WebView
        key={`${webSource.uri || webSource.baseUrl}|${reloadKey}|${apiBase}|${authToken || ''}`}
        ref={webRef}
        source={source}
        style={styles.flex}
        injectedJavaScriptBeforeContentLoaded={injectBefore}
        injectedJavaScript={injectBefore}
        onMessage={onMessage}
        onError={(e) => setLoadError(e.nativeEvent.description || 'Error al cargar la app web')}
        onHttpError={(e) =>
          setLoadError(`HTTP ${e.nativeEvent.statusCode} — reinicia Expo en mobile/`)
        }
        onLoadEnd={() => setLoadError('')}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs={Platform.OS === 'android'}
        mixedContentMode="always"
        startInLoadingState
        renderLoading={() => (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { padding: 8, fontSize: 12 },
});
