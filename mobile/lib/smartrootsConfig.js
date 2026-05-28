import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const AUTH_TOKEN_KEY = 'smartroots.auth.token.v1';
export const STORAGE_API_BASE = 'smartroots.mobile.apiBase.v1';
export const STORAGE_WEB_URL = 'smartroots.mobile.webUrl.v1';
export const STORAGE_USE_BUNDLED = 'smartroots.mobile.useBundled.v1';

/** `true` en Expo Go; `false` en APK/AAB instalable. */
export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

/** URLs de producción (APK) desde app.config.js → extra. */
export function getProductionDefaults() {
  const extra = Constants.expoConfig?.extra || {};
  return {
    apiBase: String(extra.apiBase || 'https://jchantre.pythonanywhere.com').replace(/\/$/, ''),
    webUrl: String(extra.webUrl || 'https://jchantre-jpg.github.io/SmartRoots/').replace(/\/$/, '') + '/',
  };
}

const DEV_API_BASE = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://127.0.0.1:5000';

/** Backend por defecto: nube en APK; localhost en Expo Go. */
export const DEFAULT_API_BASE = isExpoGo() ? DEV_API_BASE : getProductionDefaults().apiBase;

/** Web por defecto: GitHub Pages en APK; Vite LAN en Expo Go. */
export const DEFAULT_WEB_DEV_URL = 'http://192.168.0.106:5173';
export const DEFAULT_WEB_URL = isExpoGo() ? DEFAULT_WEB_DEV_URL : getProductionDefaults().webUrl;

export async function readApiBase() {
  const v = await AsyncStorage.getItem(STORAGE_API_BASE);
  return v?.trim() || DEFAULT_API_BASE;
}

export async function writeApiBase(url) {
  await AsyncStorage.setItem(STORAGE_API_BASE, (url || '').trim());
}

export async function readWebUrl() {
  const v = await AsyncStorage.getItem(STORAGE_WEB_URL);
  return v?.trim() || DEFAULT_WEB_URL;
}

export async function writeWebUrl(url) {
  await AsyncStorage.setItem(STORAGE_WEB_URL, (url || '').trim());
}

export async function readUseBundled() {
  const v = await AsyncStorage.getItem(STORAGE_USE_BUNDLED);
  if (v === null) return true;
  return v === '1';
}

export async function writeUseBundled(flag) {
  await AsyncStorage.setItem(STORAGE_USE_BUNDLED, flag ? '1' : '0');
}

/** Si la web es Vite en :5173, el backend suele estar en :5000 en la misma IP. */
export function deriveApiBaseFromWebUrl(webUrl) {
  try {
    const u = new URL((webUrl || '').trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.port === '5173') {
      u.port = '5000';
      return u.origin;
    }
    if (!u.port || u.port === '80' || u.port === '443') {
      return `${u.protocol}//${u.hostname}:5000`;
    }
    return `${u.protocol}//${u.hostname}:5000`;
  } catch {
    return null;
  }
}

export function isLocalhostApi(url) {
  return /^(https?:\/\/)?(127\.0\.0\.1|localhost|10\.0\.2\.2)(:\d+)?\/?$/i.test((url || '').trim());
}

export function isPublicTunnelUrl(url) {
  const u = (url || '').trim();
  if (!u.startsWith('https://')) return false;
  return /loca\.lt|localtunnel|ngrok/i.test(u);
}

export async function readAuthToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function writeAuthToken(token) {
  if (token) await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  else await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}
