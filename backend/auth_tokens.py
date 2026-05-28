"""
Tokens Bearer firmados con ``itsdangerous.URLSafeTimedSerializer``.

El cliente guarda el token en ``localStorage``; cada petición puede llevar
``Authorization: Bearer …``. El secreto se toma de la variable de entorno
``SMARTROOTS_SECRET`` (en desarrollo hay un valor por defecto inseguro).
"""
from __future__ import annotations

import os
from typing import Optional, Tuple

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer


def _serializer() -> URLSafeTimedSerializer:
    secret = os.environ.get("SMARTROOTS_SECRET", "smartroots-dev-secret-change-in-production")
    return URLSafeTimedSerializer(secret, salt="smartroots-auth-v1")


def make_auth_token(uid: int, email: str) -> str:
    return _serializer().dumps({"uid": int(uid), "email": str(email)})


def parse_auth_token(token: str, max_age_seconds: int = 60 * 60 * 24 * 7) -> Optional[Tuple[int, str]]:
    try:
        data = _serializer().loads(token, max_age=max_age_seconds)
        return int(data["uid"]), str(data["email"])
    except (BadSignature, SignatureExpired, KeyError, TypeError, ValueError):
        return None
