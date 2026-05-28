/** Cabeceras para localtunnel / ngrok (fetch nativo en la barra API). */
export function tunnelHeadersForUrl(url) {
  const u = String(url || '');
  const headers = {};
  if (/loca\.lt|localtunnel\.me/i.test(u)) {
    headers['Bypass-Tunnel-Reminder'] = 'true';
  }
  if (/ngrok-free\.app|\.ngrok-free\.dev|ngrok\.io/i.test(u)) {
    headers['ngrok-skip-browser-warning'] = '1';
  }
  return headers;
}

export function isPublicTunnelUrl(url) {
  const u = (url || '').trim();
  if (!u.startsWith('https://')) return false;
  return /loca\.lt|localtunnel|ngrok/i.test(u);
}
