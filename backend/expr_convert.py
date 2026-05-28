"""
Conversión entre notación LaTeX (editor visual) y texto SymPy para la API.
"""
from __future__ import annotations

from sympy import Symbol, latex as sympy_latex
from sympy.parsing.latex import parse_latex

from user_math_errors import _X, parse_roots_expression, roots_expression_error_message

_X_SYM = Symbol("x")


def sympy_to_latex(expr: str) -> str:
    """f(x) en SymPy → LaTeX para MathLive."""
    f, _ = parse_roots_expression(expr)
    return str(sympy_latex(f))


def latex_to_sympy(expr_latex: str) -> str:
    """LaTeX del editor → cadena SymPy validada (solo variable x)."""
    s = (expr_latex or "").strip()
    if not s:
        raise ValueError("Escribe una expresión en el editor matemático.")
    try:
        parsed = parse_latex(s)
    except Exception as exc:
        raise ValueError(
            "No se pudo leer la notación matemática. Usa el teclado matemático o una plantilla. "
            f"Detalle: {exc}"
        ) from exc

    extras = [sym for sym in parsed.free_symbols if sym != _X_SYM]
    if extras:
        names = ", ".join(sorted(str(sym) for sym in extras))
        raise ValueError(
            f"Solo se admite la variable x; en la fórmula aparece: {names}."
        )
    if _X_SYM not in parsed.free_symbols:
        raise ValueError(
            "La expresión debe depender de x. Ejemplo: x² − 2, no solo un número."
        )

    sympy_str = str(parsed)
    # Revalidar con el mismo pipeline que /api/solve
    parse_roots_expression(sympy_str)
    return sympy_str
