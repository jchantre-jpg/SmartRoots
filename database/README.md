# Base de datos (SmartRoots)

## Qué hay aquí

SmartRoots usa **SQLite** solo para **usuarios locales** (registro / login). No hay servidor de base de datos aparte: el archivo se crea automáticamente la primera vez que arranca el backend.

## Ubicación del archivo

El código define la ruta en `backend/auth_db.py`:

- Archivo: **`smartroots_users.sqlite3`**
- Directorio: **la misma carpeta que `auth_db.py`**, es decir **`SmartRoots/backend/`** (junto a `app.py`).

Así el backend puede abrir la BD con rutas relativas sin configuración extra.

## Esquema (tabla `users`)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INTEGER PK | Identificador autoincremental. |
| `email` | TEXT UNIQUE | Correo (comparación sin distinguir mayúsculas). |
| `password_hash` | TEXT | Hash Werkzeug (no se guarda la contraseña en claro). |
| `created_at` | TEXT ISO | Fecha de alta (UTC). |

## Notas

- En **desarrollo** el archivo aparece en `backend/` después del primer `init_db()`.
- En **producción** conviene respaldar ese `.sqlite3` y definir `SMARTROOTS_SECRET` en el entorno (ver `backend/auth_tokens.py`).
- Esta carpeta `database/` sirve para **documentación** y futuras migraciones SQL; el binario activo sigue en `backend/` salvo que cambies `DB_PATH` en código.
