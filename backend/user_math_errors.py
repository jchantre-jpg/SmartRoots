"""
Mensajes de error legibles para la API (expresiones SymPy, confusiones entre módulos).
"""
from __future__ import annotations

import re
import math
from typing import Any, List, Optional, Sequence, Tuple, Union

import sympy as sp
from sympy import Symbol, sympify
from sympy.core.sympify import SympifyError

# Un solo símbolo x para todo el backend (lambdify/diff coherentes con sympify).
_X = Symbol("x")
_SYMPY_LOCALS = {
    "x": _X,
    "exp": sp.exp,
    "log": sp.log,
    "ln": sp.log,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "sqrt": sp.sqrt,
    "pi": sp.pi,
    "E": sp.E,
}


def roots_hints() -> List[str]:
    """Pistas genéricas para errores en f(x) o g(x) en Raíces."""
    return [
        "Variable obligatoria: x. Usa plantillas o el teclado matemático si no estás seguro.",
        "Para bisección/posición falsa: intervalo [a,b] con f(a)·f(b) < 0.",
        "Si pegaste coeficientes tipo 1,0,-2, eso es polinomio en pestaña Polinomios, no f(x) aquí.",
    ]


def polynomial_hints() -> List[str]:
    return [
        "Formato: números separados por coma o espacio, de mayor a menor grado (aₙ … a₀).",
        "Ejemplo: 1,0,-5,0,4 para x⁴ − 5x² + 4.",
        "Si quieres escribir una fórmula con x (ej. sin(x)), usa la pestaña Raíces.",
    ]


def interpolation_hints() -> List[str]:
    return [
        "Cada nodo es un par (xᵢ, yᵢ): mismas cantidades en ambas listas, en el mismo orden.",
        "Las abscisas x deben ser distintas (no repitas el mismo x).",
        "Se necesitan al menos 2 nodos para interpolar.",
    ]


def _node_x_key(v: float) -> str:
    return f"{float(v):.15g}"


def validate_interpolation_nodes(
    x_nodes: object,
    y_nodes: object,
    *,
    max_nodes: int = 64,
) -> Tuple[List[float], List[float]]:
    """
    Valida nodos para Lagrange/Neville/muestreo.

    Raises:
        ValueError: mensaje en español para JSON ``error``.
    """
    if not isinstance(x_nodes, (list, tuple)) or not isinstance(y_nodes, (list, tuple)):
        raise ValueError("x_nodes e y_nodes deben ser listas JSON de números.")
    if len(x_nodes) != len(y_nodes):
        raise ValueError(
            f"x_nodes e y_nodes deben tener la misma longitud (ahora: {len(x_nodes)} frente a {len(y_nodes)})."
        )
    if len(x_nodes) < 2:
        raise ValueError("Se necesitan al menos 2 nodos para interpolar.")
    if len(x_nodes) > max_nodes:
        raise ValueError(f"Demasiados nodos ({len(x_nodes)}); el máximo en esta demo es {max_nodes}.")

    xs: List[float] = []
    ys: List[float] = []
    for i, (xv, yv) in enumerate(zip(x_nodes, y_nodes)):
        try:
            xs.append(float(xv))
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"El nodo x en la posición {i} no es un número válido ({xv!r})."
            ) from exc
        try:
            ys.append(float(yv))
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"El nodo y en la posición {i} no es un número válido ({yv!r})."
            ) from exc
        if not math.isfinite(xs[-1]) or not math.isfinite(ys[-1]):
            raise ValueError(f"El nodo en la posición {i} debe ser un número real finito.")

    seen: set[str] = set()
    for xv in xs:
        key = _node_x_key(xv)
        if key in seen:
            raise ValueError(
                "Los nodos x deben ser distintos entre sí (hay abscisas repetidas)."
            )
        seen.add(key)
    return xs, ys


def require_float_field(data: dict, key: str, label: str) -> float:
    """Lee un campo numérico obligatorio del JSON de /api/solve o similares."""
    if key not in data:
        raise ValueError(f"Falta el parámetro «{label}» ({key}).")
    try:
        v = float(data[key])
    except (TypeError, ValueError) as exc:
        raise ValueError(f"«{label}» debe ser un número válido.") from exc
    if not math.isfinite(v):
        raise ValueError(f"«{label}» debe ser un número real finito.")
    return v


def require_optional_float(data: dict, key: str) -> Optional[float]:
    if key not in data or data[key] is None:
        return None
    try:
        v = float(data[key])
    except (TypeError, ValueError) as exc:
        raise ValueError(f"«{key}» debe ser un número válido.") from exc
    if not math.isfinite(v):
        raise ValueError(f"«{key}» debe ser un número real finito.")
    return v


def coerce_optional_float(value: object, label: str) -> Optional[float]:
    """Convierte un valor JSON opcional a float con mensaje legible."""
    if value is None:
        return None
    try:
        v = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"«{label}» debe ser un número válido.") from exc
    if not math.isfinite(v):
        raise ValueError(f"«{label}» debe ser un número real finito.")
    return v


def roots_expression_error_message(expr: str, technical: Optional[str] = None) -> str:
    """
    Cuando sympify falla en Raíces / curvas: orienta si el usuario pegó coeficientes u otra cosa.
    """
    s = (expr or "").strip()
    if re.fullmatch(r"[\s\d.,;eE+-]+", s) and ("," in s or ";" in s):
        return (
            "Esto parece una lista de coeficientes de polinomio (solo números separados por coma o punto y coma). "
            "En Raíces debes escribir una función f(x) con la variable x (por ejemplo x**2 - 2). "
            "Para Horner, división sintética o deflación, usa la pestaña Polinomios."
        )
    base = (
        "No se pudo interpretar la expresión como función de x. "
        "Escribe con el teclado matemático o elige una plantilla; solo la variable x."
    )
    if technical:
        t = str(technical).strip()
        if t and len(t) < 220:
            return f"{base} Detalle: {t}"
    return base


def parse_roots_expression(expr: str) -> Tuple[Any, Symbol]:
    """
    Interpreta f(x) para Raíces: SymPy + solo variable x + debe depender de x.

    Raises:
        ValueError: mensaje en español listo para JSON ``error``.
    """
    s = (expr or "").strip()
    if not s:
        raise ValueError("Escribe una expresión para f(x).")
    if re.fullmatch(r"[\s\d.,;eE+-]+", s) and ("," in s or ";" in s):
        raise ValueError(roots_expression_error_message(s))
    try:
        f_s = sympify(s, locals=_SYMPY_LOCALS)
    except (SympifyError, SyntaxError, TypeError, AttributeError) as exc:
        raise ValueError(roots_expression_error_message(s, str(exc))) from exc

    extras = [sym for sym in f_s.free_symbols if sym != _X]
    if extras:
        names = ", ".join(sorted(str(sym) for sym in extras))
        raise ValueError(
            f"Solo se admite la variable x en f(x); en la expresión aparece: {names}. "
            "Reemplaza otras letras por x o abre el módulo que corresponda."
        )
    if _X not in f_s.free_symbols:
        raise ValueError(
            "La expresión no depende de x (o se simplificó a una constante). "
            "Para buscar raíces de f(x)=0 escribe una función con x, por ejemplo x**2 - 2 o exp(x) - 3*x."
        )
    return f_s, _X


def parse_g_expression(expr: str) -> Tuple[Any, Symbol]:
    """Igual que ``parse_roots_expression`` pero para g(x) en punto fijo."""
    return parse_roots_expression(expr)


def parse_coefficients_list(
    coefficients: Union[Sequence[object], object],
    *,
    max_len: int = 120,
    field_name: str = "coefficients",
) -> List[float]:
    """
    Valida coeficientes para /api/polynomial/*: lista JSON de números o texto «1,0,-2».
    """
    if isinstance(coefficients, str):
        parts = [p.strip() for p in re.split(r"[,;\s]+", coefficients.strip()) if p.strip()]
        if not parts:
            raise ValueError("La lista de coeficientes está vacía.")
        if _looks_like_algebraic_expression(coefficients):
            raise ValueError(
                "Esto parece una fórmula con x u operadores (**, sin, etc.), no una lista de coeficientes. "
                "En Polinomios solo van números separados por comas (mayor a menor grado). "
                "Para ecuaciones con x usa la pestaña Raíces."
            )
        coefficients = parts
    if not isinstance(coefficients, (list, tuple)):
        raise ValueError(
            f"«{field_name}» debe ser una lista JSON de números o un texto tipo «1,0,-2» (coeficientes aₙ … a₀)."
        )
    if len(coefficients) == 0:
        raise ValueError("La lista de coeficientes no puede estar vacía.")
    if len(coefficients) > max_len:
        raise ValueError(f"Demasiados coeficientes ({len(coefficients)}); el máximo en esta demo es {max_len}.")
    out: List[float] = []
    for i, c in enumerate(coefficients):
        if isinstance(c, str) and _looks_like_algebraic_expression(c):
            raise ValueError(
                f"El coeficiente en la posición {i} parece una fórmula ({c!r}), no un número. "
                "En Polinomios solo van coeficientes numéricos; para expresiones con x usa Raíces."
            )
        try:
            out.append(float(c))
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"El coeficiente en la posición {i} no es un número válido ({c!r}). "
                "Cada elemento debe ser numérico. Si pegaste una fórmula con x, usa la pestaña Raíces."
            ) from exc
    return out


def _looks_like_algebraic_expression(s: str) -> bool:
    """True si parece fórmula (x, potencias, funciones); no marcar «(2)» u otros números con paréntesis."""
    t = s.lower()
    if re.search(r"\bx\b", t):
        return True
    if "**" in s or "^" in t:
        return True
    if re.search(r"\b(sin|cos|tan|log|ln|exp|sqrt)\s*\(", t):
        return True
    return False


def error_json(message: str, *, hints: Optional[Sequence[str]] = None) -> dict:
    """Cuerpo JSON estándar para respuestas 400 con pistas opcionales."""
    body: dict = {"error": message}
    if hints:
        body["hints"] = list(hints)
    return body
