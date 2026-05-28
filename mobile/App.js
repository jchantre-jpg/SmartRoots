/**
 * SmartRoots móvil — WebView a pantalla completa (misma UI que la web).
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmartRootsWebView } from './components/SmartRootsWebView';
import { checkHealth } from './lib/api';
import {
  isExpoMetroRootUrl,
  normalizeWebAppUri,
  resolveFlaskWebUri,
  resolveWebAppUri,
} from './lib/bundledWeb';
import {
  DEFAULT_API_BASE,
  DEFAULT_WEB_DEV_URL,
  deriveApiBaseFromWebUrl,
  isExpoGo,
  isLocalhostApi,
  isPublicTunnelUrl,
  readApiBase,
  readUseBundled,
  readWebUrl,
  writeApiBase,
  writeUseBundled,
  writeWebUrl,
} from './lib/smartrootsConfig';

const COLORS = {
  bg: '#050a14',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: 'rgba(148,163,184,0.25)',
  primary: '#38bdf8',
  ok: '#4ade80',
  err: '#f87171',
};

function ConfigField({ label, value, onChange }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.fieldInput}
      />
    </View>
  );
}

function ConfigModal({ visible, onClose, apiBase, setApiBase, onSave, onPaste }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Conexión al servidor</Text>
          <Text style={styles.modalNote}>
            Backend Flask (URL https del túnel). La app web se carga desde el mismo servidor.
          </Text>
          <ConfigField label="Backend" value={apiBase} onChange={setApiBase} />
          <TouchableOpacity onPress={onPaste} style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Pegar URL</Text>
          </TouchableOpacity>
          {resolveFlaskWebUri(apiBase) ? (
            <Text style={styles.modalNote}>Web: {resolveFlaskWebUri(apiBase)}</Text>
          ) : null}
          <TouchableOpacity onPress={onSave} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Guardar y recargar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.btnClose}>
            <Text style={styles.btnCloseText}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FloatingControls({ backendOk, onOpenConfig, onReload }) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.floatingWrap, { bottom: 12 + insets.bottom, right: 12 + insets.right }]}>
      {backendOk === false ? (
        <View style={[styles.floatingPill, styles.floatingPillErr]}>
          <Text style={styles.floatingPillText}>Sin API</Text>
        </View>
      ) : null}
      <TouchableOpacity onPress={onReload} style={styles.fab} accessibilityLabel="Recargar">
        <Text style={styles.fabIcon}>↻</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onOpenConfig} style={[styles.fab, styles.fabPrimary]} accessibilityLabel="Conexión">
        <Text style={styles.fabIcon}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [webUrl, setWebUrl] = useState(DEFAULT_WEB_DEV_URL);
  const [, setUseBundled] = useState(true);
  const [webUri, setWebUri] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [backendOk, setBackendOk] = useState(null);
  const [booting, setBooting] = useState(true);

  const loadConfig = useCallback(async () => {
    setBooting(true);
    const [apiStored, web, bundled] = await Promise.all([readApiBase(), readWebUrl(), readUseBundled()]);
    let api = apiStored;
    const derived = deriveApiBaseFromWebUrl(web);
    if (derived && !isPublicTunnelUrl(api) && (isLocalhostApi(api) || !api?.trim())) {
      api = derived;
      await writeApiBase(api);
    }
    setApiBase(api);
    setWebUrl(web);
    setUseBundled(bundled);

    let uri;
    if (!isExpoGo()) {
      uri = normalizeWebAppUri(web?.trim() || (await readWebUrl()), api);
    } else {
      const webFromFlask = await resolveWebAppUri({ apiBase: api });
      uri = webFromFlask || normalizeWebAppUri(web?.trim(), api);
      if (!uri || isExpoMetroRootUrl(uri)) {
        uri = webFromFlask || normalizeWebAppUri(null, api);
      }
    }
    setWebUri(normalizeWebAppUri(uri, api));
    setBooting(false);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const pingBackend = useCallback(async () => {
    setBackendOk(await checkHealth(apiBase));
  }, [apiBase]);

  useEffect(() => {
    pingBackend();
    const t = setInterval(pingBackend, 12000);
    return () => clearInterval(t);
  }, [pingBackend]);

  useEffect(() => {
    if (backendOk === false) setConfigOpen(true);
  }, [backendOk]);

  const pasteTunnelUrl = async () => {
    const t = await Clipboard.getStringAsync();
    if (t?.trim()) setApiBase(t.trim().replace(/\/$/, ''));
  };

  const saveConfig = async () => {
    let api = apiBase.trim();
    const derived = deriveApiBaseFromWebUrl(webUrl);
    if (derived && !isPublicTunnelUrl(api) && (isLocalhostApi(api) || !api)) api = derived;
    setApiBase(api);
    await writeApiBase(api);
    const flaskWeb = resolveFlaskWebUri(api);
    if (flaskWeb) await writeWebUrl(flaskWeb);
    else await writeWebUrl(webUrl);
    await writeUseBundled(true);
    setConfigOpen(false);
    setReloadKey((k) => k + 1);
    await loadConfig();
    pingBackend();
  };

  if (booting) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" translucent={false} backgroundColor={COLORS.bg} />

      <View style={styles.webWrap}>
        <SmartRootsWebView
          uri={webUri}
          apiBase={apiBase}
          reloadKey={reloadKey}
          colors={COLORS}
          onReady={() => {}}
        />
      </View>

      <FloatingControls
        backendOk={backendOk}
        onOpenConfig={() => setConfigOpen(true)}
        onReload={() => setReloadKey((k) => k + 1)}
      />

      <ConfigModal
        visible={configOpen}
        onClose={() => setConfigOpen(false)}
        apiBase={apiBase}
        setApiBase={setApiBase}
        onSave={saveConfig}
        onPaste={pasteTunnelUrl}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  webWrap: { flex: 1 },
  floatingWrap: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 4,
  },
  floatingPillErr: { backgroundColor: 'rgba(248,113,113,0.9)' },
  floatingPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPrimary: { borderColor: 'rgba(56,189,248,0.45)' },
  fabIcon: { color: COLORS.text, fontSize: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalNote: { color: COLORS.muted, fontSize: 12, marginBottom: 10, lineHeight: 18 },
  fieldLabel: { color: COLORS.muted, fontSize: 12, marginBottom: 4, fontWeight: '600' },
  fieldInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: 'rgba(15,23,42,0.75)',
    fontSize: 14,
  },
  btnSecondary: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnSecondaryText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
  btnClose: { marginTop: 14, alignItems: 'center', paddingVertical: 8 },
  btnCloseText: { color: COLORS.muted, fontSize: 14 },
});
