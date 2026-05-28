# Backend (Flask + SymPy + NumPy)

## Arranque rápido

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Por defecto escucha en el puerto **5000** (compatible con el proxy de Vite en `frontend/vite.config.js`).

## Módulos (resumen)

| Archivo | Responsabilidad |
|---------|-----------------|
| **`app.py`** | Aplicación Flask: rutas `/api/*`, validación de entrada, orquestación. |
| **`root_methods.py`** | Métodos de raíces: bisección, Newton, secante, punto fijo, posición falsa, etc. |
| **`polynomial.py`** | Horner, división sintética, trazas y deflación con Newton–Horner. |
| **`interpolation.py`** | Lagrange, Neville, muestreos y demo Runge / Chebyshev. |
| **`method_selector.py`** | Heurística para recomendar método según expresión, intervalo y derivadas. |
| **`auth_db.py`** | SQLite: registro, login, consulta por id. Crea `smartroots_users.sqlite3` en esta carpeta. |
| **`auth_tokens.py`** | Tokens firmados (itsdangerous) para cabecera `Authorization: Bearer`. |
| **`verify_exhaustive.py`** | Pruebas numéricas y de rutas HTTP (ejecutar desde esta carpeta). |

## Imports

Los módulos se importan entre sí como **paquete plano** (misma carpeta), p. ej. `from root_methods import newton`. Mantén `app.py` en esta raíz si cambias la estructura.

## Variables de entorno útiles

| Variable | Uso |
|----------|-----|
| `SMARTROOTS_SECRET` | Secreto para firmar tokens (producción). Valor por defecto solo para desarrollo. |

## CORS

`app.py` habilita CORS para el cliente web en desarrollo. Ajusta orígenes si despliegas frontend y backend en dominios distintos.
