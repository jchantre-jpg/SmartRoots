# SmartRoots

Suite educativa para **raíces de funciones**, **polinomios (Horner / deflación)** e **interpolación polinómica**, con asistente heurístico (SymPy), tablas paso a paso y gráficas (Chart.js).

## Estructura del repositorio

| Carpeta | Rol |
|--------|-----|
| **`frontend/`** | App **React + Vite + Tailwind v4**: UI, temas, llamadas HTTP a `/api/*`. |
| **`backend/`** | API **Flask** (Python): SymPy, NumPy, métodos numéricos y autenticación. |
| **`database/`** | Documentación del modelo de datos; el archivo SQLite se genera al usar auth (ver README ahí). |
| **`mobile/`** | Cliente **Expo** que consume la misma API HTTP. |

```
SmartRoots/
├── frontend/     # npm run dev
├── backend/      # python app.py
├── database/     # notas + esquema lógico
├── mobile/       # npx expo start
└── README.md     # este archivo
```

## Cómo correr la web (desarrollo)

Necesitas **dos terminales**: primero el API, luego Vite.

### 1. Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Servidor en `http://127.0.0.1:5000`.

### 2. Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Abre **`http://127.0.0.1:5173/`**. El proxy de Vite reenvía `/api/*` al Flask.

Si ves `ECONNREFUSED` hacia el puerto 5000, el backend no está levantado.

Rutas con espacios en Windows: usa comillas, p. ej. `cd "...\SmartRoots\frontend"`.

### Producción / GitHub Pages (sin tarjeta)

Guía paso a paso: **[docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md)**

- **Web:** GitHub Pages (workflow incluido).
- **API:** tu PC + [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) o `npm run tunnel:backend` en `mobile/` (sin tarjeta).
- Variables en GitHub: `VITE_BASE` (ej. `/SmartRoots/`) y `VITE_API_BASE` (URL del túnel).

En local, define `VITE_API_BASE` apuntando al Flask (p. ej. `http://192.168.0.15:5000`) si no usas el proxy de Vite.

## Cómo correr el móvil (Expo)

```bash
cd mobile
npm install
npx expo start
```

- **Emulador Android**: `http://10.0.2.2:5000` (por defecto en la app).
- **Dispositivo físico**: `http://<IP-del-PC>:5000` y firewall abierto en el puerto 5000.

La app móvil incluye las mismas secciones que la web (Inicio, Raíces, Polinomios, Interpolación, Conceptos, Acerca), login/registro y todos los métodos numéricos vía la misma API. Detalle en `mobile/README.md`.

## Documentación adicional

- `frontend/README.md` — mapa de `src/` (componentes, `lib/`, estilos).
- `backend/README.md` — módulos Python y arranque.
- `database/README.md` — SQLite y tabla `users`.

## API principal (resumen)

| Método | Ruta | Uso |
|--------|------|-----|
| POST | `/api/recommend` | Recomendación de método según expresión e intervalo/semillas. |
| POST | `/api/solve` | Ejecuta un método de raíces. |
| POST | `/api/sample_curve` | Muestreo de `f(x)` para gráficas. |
| POST | `/api/polynomial/*` | Horner, división sintética, deflación. |
| POST | `/api/interpolation/*` | Lagrange, Neville, Runge/Chebyshev. |

---

Proyecto pensado para integrar el temario numérico en una experiencia clara entre **web** y **móvil**.
