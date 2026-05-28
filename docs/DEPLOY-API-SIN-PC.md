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

1. Cuenta en [pythonanywhere.com](https://www.pythonanywhere.com) (plan Beginner, gratis).
2. **Consoles** → **Bash**:

```bash
git clone https://github.com/jchantre-jpg/SmartRoots.git
cd SmartRoots/backend
pip install --user -r requirements.txt
```

3. **Web** → **Add a new web app** → **Manual configuration** → Python 3.11.
4. **Virtualenv** o ruta: apunta a la carpeta donde instalaste paquetes.
5. **WSGI configuration file** — sustituye el contenido por (cambia `TU_USUARIO`):

```python
import sys
path = '/home/TU_USUARIO/SmartRoots/backend'
if path not in sys.path:
    sys.path.insert(0, path)
from wsgi import application
```

6. **Environment variables** (pestaña Web → Environment):

| Variable | Valor |
|----------|--------|
| `SMARTROOTS_SECRET` | una frase larga aleatoria (no la compartas) |

7. **Reload** la web app.
8. URL: `https://TU_USUARIO.pythonanywhere.com/api/health`
9. Pon esa URL base (sin `/api`) en `VITE_API_BASE` y vuelve a lanzar el workflow de Pages.

---

## Resumen

```text
Antes:  Pages (GitHub)  +  API en tu PC (cloudflared)  →  solo funciona con PC encendido
Después: Pages (GitHub)  +  API en Render/PA          →  funciona sin tu PC
```

Si cambias la URL de la API, actualiza `VITE_API_BASE` y **Run workflow** en Pages.
