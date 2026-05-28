# API SmartRoots 24/7 (sin tu PC)

La web en **GitHub Pages** ya está en la nube. El **cálculo** (`/api/*`) necesita un servidor Python siempre encendido.

| Pieza | Dónde | ¿Tu PC? |
|-------|--------|---------|
| Interfaz | https://jchantre-jpg.github.io/SmartRoots/ | No |
| API Flask | Render o PythonAnywhere (abajo) | No |

Cuando la API esté en la nube, **dejas de usar** `cloudflared` y `python app.py` en tu casa.

---

## Opción A — Render (recomendada, desde GitHub)

1. Cuenta gratis en [render.com](https://render.com) (a veces piden tarjeta solo para verificar; no cobran en plan free).
2. **Dashboard** → **New +** → **Blueprint**.
3. Conecta el repo **jchantre-jpg/SmartRoots** (rama `main`).
4. Render lee `render.yaml` y crea el servicio `smartroots-api`.
5. Espera el deploy en verde. Copia la URL pública, por ejemplo:
   `https://smartroots-api.onrender.com`
6. Prueba en el navegador: `https://TU-URL.onrender.com/api/health` → `{"status":"ok",...}`

**En GitHub** (Settings → Actions → Variables):

| Variable | Valor |
|----------|--------|
| `VITE_BASE` | `/SmartRoots/` |
| `VITE_API_BASE` | `https://smartroots-api.onrender.com` (sin `/` final) |

7. **Actions** → **Deploy GitHub Pages** → **Run workflow**.

**Plan free:** si nadie usa la API ~15 min, se “duerme”; la primera petición puede tardar 30–60 s. Los usuarios registrados en SQLite **pueden perderse** si Render vuelve a desplegar (disco efímero). Para demo, crea cuenta de nuevo o regístrate en la web.

---

## Opción B — PythonAnywhere (sin tarjeta)

Guía completa con capturas mentales paso a paso: **[PYTHONANYWHERE-PASO-A-PASO.md](./PYTHONANYWHERE-PASO-A-PASO.md)**.

---

## Resumen

```text
Antes:  Pages (GitHub)  +  API en tu PC (cloudflared)  →  solo funciona con PC encendido
Después: Pages (GitHub)  +  API en Render/PA          →  funciona sin tu PC
```

Si cambias la URL de la API, actualiza `VITE_API_BASE` y **Run workflow** en Pages.
