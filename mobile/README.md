# SmartRoots móvil (Expo)

Misma app que la web (WebView). Funciona **sin misma WiFi** usando `expo start --tunnel` + túnel público para Flask.

## Modo tunnel (recomendado)

**Terminal 1 — Flask**
```bash
cd SmartRoots/backend
python app.py
```

**Terminal 2 — Túnel del API (copia la URL https)**
```bash
cd SmartRoots/mobile
npm run tunnel:backend
```
Verás algo como `https://xxxx.loca.lt` → **cópiala**.

**Terminal 3 — Expo con tunnel**
```bash
cd SmartRoots/mobile
npm run start:tunnel
```

**En el teléfono (Expo Go)**

1. Escanea el QR de Expo (tunnel).
2. Pulsa **Red** → pega la URL **https** del paso 2 en **Backend Flask**.
3. Deja **Web empaquetada** activada.
4. **Guardar y recargar** → debe salir **API OK**.
5. Prueba **Analizar y graficar**.

## Modo misma WiFi (opcional)

- Backend: `http://IP-de-tu-PC:5000`
- Vite: desactiva web empaquetada y usa `http://IP:5173`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run start:tunnel` | Expo con `--tunnel` |
| `npm run tunnel:backend` | Publica Flask en Internet (localtunnel) |
| `npm run build:mobile` | Regenera web empaquetada en `assets/web` |

## APK instalable (sin Expo Go)

Guía completa: **[../docs/BUILD-APK.md](../docs/BUILD-APK.md)**

```bash
cd SmartRoots/mobile
npm install
npx eas-cli login
npm run build:apk
```

## Demo

`demo_smartroots` / `SmartRoots1!`
