"""
Persistencia de usuarios en SQLite (registro e inicio de sesión).

El archivo ``smartroots_users.sqlite3`` se crea junto a este módulo (carpeta ``backend/``).
"""
from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from werkzeug.security import check_password_hash, generate_password_hash

from auth_validation import (
    normalize_email,
    normalize_full_name,
    normalize_username,
    password_rule_checks,
    validate_email,
    validate_full_name,
    validate_password,
    validate_password_confirm,
    validate_username,
)

DB_PATH = Path(__file__).resolve().parent / "smartroots_users.sqlite3"


def _row_to_user(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": int(row["id"]),
        "email": str(row["email"]),
        "username": str(row["username"]),
        "full_name": str(row["full_name"]),
    }


def _migrate(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            full_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    cols = {r[1] for r in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "username" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN username TEXT")
    if "full_name" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN full_name TEXT NOT NULL DEFAULT ''")
    rows = conn.execute("SELECT id, email, username FROM users").fetchall()
    for rid, email, username in rows:
        uname = username
        if not uname:
            base = (email or "user").split("@")[0]
            base = "".join(c for c in base if c.isalnum() or c == "_")[:24] or "user"
            candidate = base
            n = 0
            while True:
                exists = conn.execute(
                    "SELECT 1 FROM users WHERE username = ? COLLATE NOCASE AND id != ?",
                    (candidate, rid),
                ).fetchone()
                if not exists:
                    break
                n += 1
                candidate = f"{base}{n}"
            uname = candidate
            conn.execute("UPDATE users SET username = ? WHERE id = ?", (uname, rid))
        fname = conn.execute("SELECT full_name FROM users WHERE id = ?", (rid,)).fetchone()
        if fname and (fname[0] is None or str(fname[0]).strip() == ""):
            conn.execute(
                "UPDATE users SET full_name = ? WHERE id = ?",
                (uname.replace("_", " ").title(), rid),
            )
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username COLLATE NOCASE)"
    )
    conn.commit()


def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        _migrate(conn)
    finally:
        conn.close()


def register_user(
    full_name: str,
    email: str,
    username: str,
    password: str,
    password_confirm: str,
) -> Tuple[bool, str, Optional[Dict[str, Any]], List[str]]:
    hints: List[str] = []

    ok, msg = validate_full_name(full_name)
    if not ok:
        return False, msg, None, hints

    ok, msg = validate_email(email)
    if not ok:
        return False, msg, None, hints

    ok, msg = validate_username(username)
    if not ok:
        return False, msg, None, hints

    ok, msg, _pw_hints = validate_password(password)
    if not ok:
        hint_labels = [label for label, passed in password_rule_checks(password) if not passed]
        return False, msg, None, hint_labels

    ok, msg = validate_password_confirm(password, password_confirm)
    if not ok:
        return False, msg, None, hints

    name_n = normalize_full_name(full_name)
    email_n = normalize_email(email)
    user_n = normalize_username(username)
    ph = generate_password_hash(password)
    now = datetime.now(timezone.utc).isoformat()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        _migrate(conn)
        conn.execute(
            """
            INSERT INTO users (email, username, full_name, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (email_n, user_n, name_n, ph, now),
        )
        conn.commit()
        uid = int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])
        row = conn.execute(
            "SELECT id, email, username, full_name FROM users WHERE id = ?",
            (uid,),
        ).fetchone()
        return True, "ok", _row_to_user(row), hints
    except sqlite3.IntegrityError as exc:
        msg = str(exc).lower()
        if "email" in msg:
            return False, "Ese correo ya está registrado.", None, hints
        if "username" in msg:
            return False, "Ese nombre de usuario ya está en uso.", None, hints
        return False, "No se pudo crear la cuenta (datos duplicados).", None, hints
    finally:
        conn.close()


def verify_login(username: str, password: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    user_n = normalize_username(username)
    if not user_n:
        return False, "Introduce tu usuario.", None

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        _migrate(conn)
        row = conn.execute(
            "SELECT id, email, username, full_name, password_hash FROM users WHERE username = ?",
            (user_n,),
        ).fetchone()
        if row is None:
            return False, "Usuario o contraseña incorrectos.", None
        if not check_password_hash(str(row["password_hash"]), password or ""):
            return False, "Usuario o contraseña incorrectos.", None
        return True, "ok", _row_to_user(row)
    finally:
        conn.close()


def get_user_by_id(uid: int) -> Optional[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        _migrate(conn)
        row = conn.execute(
            "SELECT id, email, username, full_name FROM users WHERE id = ?",
            (int(uid),),
        ).fetchone()
        if row is None:
            return None
        return _row_to_user(row)
    finally:
        conn.close()
