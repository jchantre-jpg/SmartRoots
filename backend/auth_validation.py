"""
Validación de registro: usuario, correo y contraseña segura.
"""
from __future__ import annotations

import re
from typing import List, Tuple

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,32}$")

PASSWORD_MIN_LEN = 8
PASSWORD_SPECIAL = re.compile(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]")


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def normalize_username(username: str) -> str:
    return (username or "").strip().lower()


def normalize_full_name(full_name: str) -> str:
    return " ".join((full_name or "").strip().split())


def password_rule_checks(password: str) -> List[Tuple[str, bool]]:
    p = password or ""
    return [
        (f"Al menos {PASSWORD_MIN_LEN} caracteres", len(p) >= PASSWORD_MIN_LEN),
        ("Una letra mayúscula (A–Z)", bool(re.search(r"[A-Z]", p))),
        ("Una letra minúscula (a–z)", bool(re.search(r"[a-z]", p))),
        ("Un número (0–9)", bool(re.search(r"\d", p))),
        ("Un carácter especial (!@#$…)", bool(PASSWORD_SPECIAL.search(p))),
    ]


def validate_password(password: str) -> Tuple[bool, str, List[str]]:
    checks = password_rule_checks(password)
    failed = [label for label, ok in checks if not ok]
    if not failed:
        return True, "ok", []
    hints = [f"La contraseña debe incluir: {', '.join(failed)}."]
    return False, hints[0], hints


def validate_password_confirm(password: str, confirm: str) -> Tuple[bool, str]:
    if (password or "") != (confirm or ""):
        return False, "La confirmación de contraseña no coincide."
    return True, "ok"


def validate_username(username: str) -> Tuple[bool, str]:
    u = normalize_username(username)
    if not u:
        return False, "El nombre de usuario es obligatorio."
    if not USERNAME_RE.match(u):
        return (
            False,
            "Usuario: 3–32 caracteres, solo letras, números y guion bajo (_).",
        )
    return True, "ok"


def validate_email(email: str) -> Tuple[bool, str]:
    e = normalize_email(email)
    if not e:
        return False, "El correo electrónico es obligatorio."
    if not EMAIL_RE.match(e):
        return False, "Introduce un correo electrónico válido."
    return True, "ok"


def validate_full_name(full_name: str) -> Tuple[bool, str]:
    name = normalize_full_name(full_name)
    if len(name) < 3:
        return False, "El nombre completo debe tener al menos 3 caracteres."
    if len(name) > 120:
        return False, "El nombre completo es demasiado largo (máx. 120)."
    return True, "ok"
