# Publicar SmartRoots en GitHub Pages (sin tarjeta)

GitHub Pages aloja **solo la web** (`frontend/`). El **backend Flask** sigue en otro sitio (tu PC con túnel, sin tarjeta).

## Qué necesitas

| Pieza | Dónde | ¿Tarjeta? |
|-------|--------|-----------|
| **Web** | GitHub Pages | No |
| **API** (`/api/*`) | Render / PythonAnywhere (24/7) o túnel desde tu PC | No |
| **Móvil** (opcional) | Expo Go → misma URL de la API | No |

---

## 1. Subir el proyecto a GitHub

1. Crea un repositorio en [github.com/new](https://github.com/new) (público o privado).
2. En la carpeta `SmartRoots` (donde están `frontend/` y `backend/`):

```bash
git init
git add .
git commit -m "SmartRoots: web, backend y móvil"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si el repo está dentro de `maquina de goldberg`, sube la carpeta `SmartRoots` o todo el proyecto según prefieras.

---

## 2. Activar GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. No hace falta tarjeta.

El workflow `.github/workflows/deploy-pages.yml` se ejecuta al hacer push a `main`.

---

## 3. Variables del repositorio (importante)

**Settings** → **Secrets and variables** → **Actions** → **Variables** → **New repository variable**

| Variable | Ejemplo | Para qué |
|----------|---------|----------|
| `VITE_BASE` | `/TU_REPO/` | Ruta del sitio. Si el repo se llama `SmartRoots`, usa `/SmartRoots/` (con `/` al inicio y al final). Si el repo es `tuusuario.github.io`, usa `/`. |
| `VITE_API_BASE` | `https://xxxx.trycloudflare.com` | URL pública de tu Flask (sin `/` final). |

Sin `VITE_API_BASE`, la web en Pages no podrá calcular (solo se verá la interfaz).

Vuelve a desplegar: **Actions** → **Deploy GitHub Pages** → **Run workflow**, o haz un push vacío.

Tu web quedará en:

`https://TU_USUARIO.github.io/TU_REPO/`

---

## 4. Backend (API)

GitHub Pages **no** ejecuta Python.

**Para que funcione sin tu PC:** sigue **[DEPLOY-API-SIN-PC.md](./DEPLOY-API-SIN-PC.md)** (Render o PythonAnywhere).

**Solo para practicar en casa** (PC encendido):

### A) Cloudflare Tunnel (recomendado)

1. Instala [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. En una terminal:

```bash
cd backend
python app.py
```

3. En otra:

```bash
cloudflared tunnel --url http://127.0.0.1:5000
```

4. Copia la URL `https://….trycloudflare.com` → variable `VITE_API_BASE` en GitHub.
5. Vuelve a ejecutar el workflow de Pages (o push).

CORS en Flask ya permite otros orígenes.

### B) localtunnel (como en móvil)

```bash
cd mobile
npm run tunnel:backend
```

Usa la URL `https://….loca.lt` en `VITE_API_BASE`.

### C) PythonAnywhere (cuenta free)

Cuenta en [pythonanywhere.com](https://www.pythonanywhere.com) sin tarjeta. Sube el backend; comprueba que SymPy/NumPy funcionen en el plan free.

---

## 5. Probar

1. Abre `https://TU_USUARIO.github.io/TU_REPO/`
2. Si ves la UI pero “sin conexión” al calcular → revisa `VITE_API_BASE` y que Flask/túnel estén activos.
3. Prueba en el navegador: `https://TU_TUNEL/api/health` → debe responder `{"status":"ok",...}`

---

## 6. Móvil

En **Red** (⚙ en la app):

- **Backend:** la misma `VITE_API_BASE` (URL del túnel).
- La web empaquetada puede seguir cargando desde Flask `/app/` o usar la URL de GitHub Pages (solo UI; la API sigue siendo el túnel).

---

## Resumen

```text
GitHub Pages  →  interfaz web (siempre online si el repo está en GitHub)
Túnel / PC    →  API Flask (cuando tu PC está encendido y el túnel activo)
```

Para 24/7 sin PC usa **Render** o **PythonAnywhere** (ver `DEPLOY-API-SIN-PC.md`). El túnel Cloudflare es solo temporal.
