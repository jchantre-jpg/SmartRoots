"""
Selección heurística del método de raíces más razonable dado ``f``, intervalo ``[a,b]`` y semillas.

Combina análisis simbólico (derivadas, bracket) con reglas educativas; **no** sustituye
el criterio teórico del curso ni garantiza convergencia.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

import math
import numpy as np
from sympy import diff, lambdify

from root_methods import bracket_root
from user_math_errors import parse_g_expression, parse_roots_expression


def _safe_parse(expr: str):
    return parse_roots_expression(expr)


def sample_curve(expr: str, xmin: float, xmax: float, n: int = 200) -> Dict[str, Any]:
    f_s, x = _safe_parse(expr)
    fn = lambdify(x, f_s, modules=["numpy"])
    xs = np.linspace(xmin, xmax, n)
    ys = []
    for t in xs:
        try:
            v = float(fn(float(t)))
            if np.isnan(v) or np.isinf(v):
                v = None
        except Exception:
            v = None
        ys.append(v)

    warnings: List[str] = []
    finite = [v for v in ys if v is not None and np.isfinite(v)]
    none_count = sum(1 for v in ys if v is None)
    if none_count > max(3, int(n * 0.04)):
        warnings.append(
            f"En {none_count} de {n} puntos f(x) no es un número real finito en el intervalo: "
            "puede haber asíntotas, logaritmos fuera de dominio o valores complejos."
        )
    if len(finite) >= 2:
        vals = np.array(finite, dtype=float)
        mxv = float(np.max(np.abs(vals)))
        stdv = float(np.std(vals))
        if stdv > 1e12 * (1.0 + mxv):
            warnings.append("f(x) cambia órdenes de magnitud muy fuerte en el intervalo: ajusta el rango o revisa singularidades.")

    # Comprobar si la expresión simbólica toma partes imaginarias en muestras del intervalo
    try:
        from sympy import N as sym_N

        for tv in np.linspace(float(xmin), float(xmax), min(9, n)):
            try:
                z = complex(sym_N(f_s.subs(x, float(tv)), 32))
                if abs(z.imag) > 1e-8:
                    warnings.append(
                        "f(x) no es real en parte del intervalo (parte imaginaria distinta de cero): "
                        "las raíces en ℝ pueden no existir o la rama no es la esperada."
                    )
                    break
            except Exception:
                continue
    except Exception:
        pass

    out: Dict[str, Any] = {"x": xs.tolist(), "y": ys}
    if warnings:
        out["warnings"] = warnings
    return out


def recommend_for_expression(
    expr: str,
    a: Optional[float] = None,
    b: Optional[float] = None,
    x0: Optional[float] = None,
    x1: Optional[float] = None,
    g_expression: Optional[str] = None,
    highlight_contractive: bool = False,
) -> Dict[str, Any]:
    f_s, x = _safe_parse(expr)
    fn = lambdify(x, f_s, modules=["numpy"])
    d_s = diff(f_s, x)
    dfn = lambdify(x, d_s, modules=["numpy"])

    def f(v: float) -> float:
        return float(fn(v))

    def df(v: float) -> float:
        return float(dfn(v))

    reasons: List[str] = []
    candidates: List[Dict[str, Any]] = []

    bracket: Optional[Tuple[float, float]] = None
    if a is not None and b is not None:
        try:
            fa, fb = f(float(a)), f(float(b))
            if fa * fb < 0:
                bracket = (float(a), float(b))
                reasons.append("Hay cambio de signo en [a,b]: métodos de corte seguro (bisección, posición falsa).")
            else:
                auto = bracket_root(f, float(a), float(b), n=96)
                if auto:
                    bracket = auto
                    reasons.append("Se detectó un intervalo con cambio de signo al barrer [a,b].")
        except Exception as e:
            reasons.append(f"No se pudo evaluar el intervalo: {e}")

    deriv_ok = True
    try:
        probe = 0.0 if x0 is None else float(x0)
        dv = float(df(probe))
        if not math.isfinite(dv):
            deriv_ok = False
            reasons.append("f′(x₀) no es un número real finito: Newton–Raphson no se propone (derivada no usable en la semilla).")
    except Exception:
        deriv_ok = False
        reasons.append("La derivada simbólica no evalúa bien en el punto de prueba; Newton puede ser frágil.")

    if deriv_ok and x0 is not None:
        candidates.append(
            {
                "method": "newton_raphson",
                "label": "Newton–Raphson",
                "score": 90,
                "when": "Convergencia cuadrática si x0 está cerca y f' no se anula.",
            }
        )
    if x0 is not None and x1 is not None:
        candidates.append(
            {
                "method": "secant",
                "label": "Secante",
                "score": 82,
                "when": "No requiere derivada explícita; necesita dos buenas semillas.",
            }
        )
    if bracket:
        candidates.append(
            {
                "method": "false_position",
                "label": "Posición falsa",
                "score": 78,
                "when": "Mantiene el intervalo; a menudo menos iteraciones que bisección en funciones monótonas.",
            }
        )
        candidates.append(
            {
                "method": "bisection",
                "label": "Bisección (búsqueda binaria)",
                "score": 70,
                "when": "Máxima robustez lineal; intervalo con cambio de signo.",
            }
        )
    if not bracket and x0 is None:
        candidates.append(
            {
                "method": "bisection",
                "label": "Bisección",
                "score": 40,
                "when": "Proporcione [a,b] con cambio de signo o deje que la app barra un rango.",
            }
        )

    # Ajuste de puntuación: con solo intervalo (sin semillas) favorecemos bisección como “opción base del curso”.
    # Con semilla x₀ pero f′ no finita y sin x₁, priorizamos posición falsa frente a bisección (sin Newton ni secante).
    if bracket and x0 is None:
        for c in candidates:
            if c["method"] == "false_position":
                c["score"] += 4
            if c["method"] == "bisection":
                c["score"] += 14
    elif bracket and x0 is not None and x1 is None and not deriv_ok:
        for c in candidates:
            if c["method"] == "false_position":
                c["score"] = max(int(c["score"]), 86)
            if c["method"] == "bisection":
                c["score"] = min(int(c["score"]), 72)

    if highlight_contractive and x0 is not None and g_expression and str(g_expression).strip():
        gex = str(g_expression).strip()
        try:
            g_s, _ = parse_g_expression(gex)
            dg_s = diff(g_s, x)
            gn = lambdify(x, g_s, modules=["numpy"])
            dgn = lambdify(x, dg_s, modules=["numpy"])
            xv = float(x0)
            gv = float(gn(xv))
            dgv = float(dgn(xv))
            if math.isfinite(gv) and math.isfinite(dgv) and abs(dgv) < 1.0:
                candidates.append(
                    {
                        "method": "fixed_point",
                        "label": "Punto fijo",
                        "score": 91,
                        "when": "|g'(x0)| < 1: iteracion x <- g(x) estable cerca de la semilla.",
                    }
                )
        except Exception:
            pass

    candidates.sort(key=lambda z: (-z["score"], z["method"]))
    primary = candidates[0] if candidates else {"method": "bisection", "label": "Bisección", "score": 0, "when": "Defina intervalo."}

    return {
        "expression": expr,
        "bracket": {"a": bracket[0], "b": bracket[1]} if bracket else None,
        "recommended": primary,
        "ranked": candidates,
        "notes": reasons,
        "fixed_point_hint": "Si puedes escribir x = g(x) con |g'(r)| < 1 cerca de la raíz, prueba iteración de punto fijo.",
    }
