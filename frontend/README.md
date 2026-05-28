# Frontend (React + Vite)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm install` | Instala dependencias. |
| `npm run dev` | Servidor de desarrollo (hot reload). |
| `npm run build` | Salida estática en `dist/`. |
| `npm run lint` | ESLint sobre el proyecto. |

## Mapa de `src/`

| Ruta | Contenido |
|------|-----------|
| **`main.jsx`** | Punto de entrada: monta React en `#root`, envuelve con `AuthProvider`. |
| **`App.jsx`** | Layout principal: cabecera con pestañas de sección (lab, roots, poly, interp, about) y workspaces. |
| **`index.css`** | Estilos globales, tema claro/oscuro (`html.sr-light`), utilidades `sr-*`. |
| **`ThemeContext.jsx`** | Paletas de color, modo claro/oscuro, variables CSS en `document.documentElement`. |
| **`AuthContext.jsx`** | Sesión: token en `localStorage`, login/registro contra `/api/auth/*`. |
| **`api.js`** | `fetch` centralizado, cabeceras, manejo de errores de red. |
| **`chartRegister.js`** | Registro de controladores Chart.js (una sola vez al cargar). |
| **`chartTheme.js`** | Colores y escalas de gráficas según tema. |
| **`components/`** | UI: workspaces, gráficas, modales, `ConceptsWorkspace` (teoría), etc. |
| **`lib/`** | Lógica pura JS: exportación CSV/LaTeX, columnas de tablas, interpretaciones de resultados. |

## API en desarrollo

`vite.config.js` define un **proxy** de `/api` → `http://127.0.0.1:5000`. El frontend usa rutas relativas `/api/...` salvo que exista `VITE_API_BASE`.

## Convenciones

- Componentes de una sola responsabilidad en `components/`.
- Cálculos reutilizables o sin DOM en `lib/`.
- Estilos compartidos: clases `sr-*` en `index.css` + Tailwind en JSX.
- Cada archivo principal incluye un **comentario JSDoc al inicio** que resume su rol; los módulos muy largos (`RootsWorkspace`, `PolyInterpWorkspace`) tienen también **marcas de sección** antes de bloques grandes.
