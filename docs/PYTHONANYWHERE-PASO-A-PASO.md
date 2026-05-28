# SmartRoots en PythonAnywhere (paso a paso)

Objetivo: tener la **API Flask** en internet **sin tu PC** y conectarla a la web en GitHub Pages.

**Tu web (ya está):** https://jchantre-jpg.github.io/SmartRoots/  
**Tu API (la crearás):** `https://TU_USUARIO.pythonanywhere.com`

Sustituye `TU_USUARIO` por el nombre de usuario que elijas al registrarte (ej. `jchantre` → `https://jchantre.pythonanywhere.com`).

---

## Paso 1 — Crear cuenta (gratis, sin tarjeta)

1. Abre [https://www.pythonanywhere.com/registration/register/beginner/](https://www.pythonanywhere.com/registration/register/beginner/)
2. Elige un **username** (será parte de la URL de la API).
3. Completa email y contraseña.
4. Plan **Beginner** (gratis).

---

## Paso 2 — Descargar el código en PythonAnywhere

1. Arriba → pestaña **Consoles**.
2. **$ Bash** (consola nueva).
3. Pega y ejecuta (Enter después de cada bloque si hace falta):

```bash
cd ~
git clone https://github.com/jchantre-jpg/SmartRoots.git
cd SmartRoots/backend
ls
```

Debes ver `app.py`, `requirements.txt`, `wsgi.py`, etc.

---

## Paso 3 — Entorno virtual e instalar dependencias

En la **misma consola Bash**:

```bash
python3.10 -m venv ~/smartroots-venv
source ~/smartroots-venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

- Tarda **varios minutos** (SymPy y NumPy son pesados). No cierres la consola hasta que termine sin error.
- Si `python3.10` no existe, prueba `python3.11 -m venv ~/smartroots-venv`.

Comprueba:

```bash
python -c "import flask, sympy, numpy; print('OK')"
```

Debe imprimir `OK`.

---

## Paso 4 — Crear la aplicación web

1. Pestaña **Web** (arriba).
2. **Add a new web app**.
3. **Manual configuration** (no uses el asistente de Flask de un clic; ya tienes el proyecto).
4. Elige **Python 3.10** (o 3.11 si es la que usaste en el venv).
5. Confirma.

---

## Paso 5 — Ruta del virtualenv

En la página **Web**, sección **Virtualenv**:

1. Escribe: `/home/TU_USUARIO/smartroots-venv`
2. Pulsa el ✓ (check) para guardar.

(Sustituye `TU_USUARIO` por tu username real de PythonAnywhere.)

---

## Paso 6 — Archivo WSGI

En la misma página **Web**, enlace azul **WSGI configuration file**.

**Borra todo** el contenido y pega esto (cambia solo `TU_USUARIO`):

```python
import sys

path = "/home/TU_USUARIO/SmartRoots/backend"
if path not in sys.path:
    sys.path.insert(0, path)

from wsgi import application
```

Arriba a la derecha del editor → **Save**.

---

## Paso 7 — Variable secreta (tokens de login)

1. En **Web**, baja a **Environment variables** (o **Code** → variables según la interfaz).
2. Añade:

| Name | Value |
|------|--------|
| `SMARTROOTS_SECRET` | Una frase larga inventada, ej. `SmartRoots-prod-2026-cambia-esto-xyz` |

Guarda.

---

## Paso 8 — Recargar y probar

1. Arriba en **Web** → botón verde **Reload** `TU_USUARIO.pythonanywhere.com`.
2. Espera unos segundos.
3. Abre en el navegador:

`https://TU_USUARIO.pythonanywhere.com/api/health`

Debe verse algo como:

```json
{"app": "SmartRoots", "status": "ok"}
```

### Si sale error 500

- **Web** → **Error log** (o **Server log**): lee la última línea (falta paquete, typo en WSGI, etc.).
- Revisa que el virtualenv sea exactamente `/home/TU_USUARIO/smartroots-venv`.
- Revisa que la ruta en WSGI sea `/home/TU_USUARIO/SmartRoots/backend` (mayúsculas en `SmartRoots`).

---

## Paso 9 — Conectar GitHub Pages con la API

1. Repo [jchantre-jpg/SmartRoots](https://github.com/jchantre-jpg/SmartRoots) → **Settings** → **Secrets and variables** → **Actions** → **Variables**.
2. Edita o crea:

| Variable | Valor |
|----------|--------|
| `VITE_BASE` | `/SmartRoots/` |
| `VITE_API_BASE` | `https://TU_USUARIO.pythonanywhere.com` |

**Importante:** sin barra al final, **sin** `/api`.

3. **Actions** → **Deploy GitHub Pages** → **Run workflow** → espera ✓ verde.

---

## Paso 10 — Probar la web completa

1. Abre https://jchantre-jpg.github.io/SmartRoots/
2. **Regístrate** (la base de datos en PythonAnywhere es nueva; el usuario demo de tu PC no existe allí salvo que lo crees).
3. Resuelve una ecuación o usa un método numérico.

Si la UI carga pero el cálculo falla → revisa `VITE_API_BASE` y que `/api/health` responda OK.

---

## Después del despliegue

| Ya no necesitas | Sigue en la nube |
|-----------------|------------------|
| `python app.py` en tu PC | API en PythonAnywhere |
| `cloudflared` / túnel | Web en GitHub Pages |

---

## Límites del plan gratis

- La API es pública en `https://TU_USUARIO.pythonanywhere.com`.
- CPU limitada: cálculos muy pesados pueden ir más lentos que en tu PC.
- **No** hace falta dejar tu PC encendido.

---

## Cuando cambies código en GitHub

En la consola Bash de PythonAnywhere:

```bash
cd ~/SmartRoots
git pull
source ~/smartroots-venv/bin/activate
pip install -r backend/requirements.txt
```

Luego **Web** → **Reload**.
