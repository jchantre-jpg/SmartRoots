"""
Métodos iterativos clásicos para buscar raíces de ``f(x)=0`` en ℝ.

Incluye bisección, posición falsa, Newton–Raphson, secante y punto fijo, con
tablas pensadas para la API (columnas alineadas con ``frontend/src/lib/iterationCols.js``).
El campo ``paso`` de cada fila contiene LaTeX para KaTeX en el frontend.
"""
from __future__ import annotations

import math
from typing import Callable, List, Optional, Tuple

import numpy as np

from math_step_tex import tex_num, tex_step_header


Solve4 = Tuple[float, List[dict], str, str]


def bisection(f: Callable[[float], float], a: float, b: float, tol: float, max_iter: int) -> Solve4:
    fa, fb = f(a), f(b)
    if fa * fb > 0:
        raise ValueError("f(a) y f(b) deben tener signos opuestos para bisección.")
    rows: List[dict] = []
    for k in range(max_iter):
        c = (a + b) / 2
        fc = f(c)
        err = abs(b - a) / 2
        if fa * fc < 0:
            accion = (
                r"f(a)\,f(c) < 0 \Rightarrow \text{raíz en } [a,c];\;"
                r"b \leftarrow c"
            )
        else:
            accion = (
                r"f(a)\,f(c) \geq 0 \Rightarrow \text{raíz en } [c,b];\;"
                r"a \leftarrow c"
            )
        paso = (
            f"{tex_step_header(k)}\\;"
            rf"[a,b]=[{tex_num(a)},\,{tex_num(b)}],\;"
            rf"c=\dfrac{{a+b}}{{2}}={tex_num(c)},\;"
            rf"f(c)={tex_num(fc)},\;"
            rf"\text{{cota }}\dfrac{{b-a}}{{2}}={tex_num(err)}.\;"
            f"{accion}"
        )
        rows.append(
            {
                "k": k,
                "a": a,
                "b": b,
                "f_a": fa,
                "f_b": fb,
                "c": c,
                "f_c": fc,
                "error": err,
                "aproximacion": c,
                "paso": paso,
            }
        )
        if abs(fc) < tol or err < tol:
            stop = "tol_abs_f" if abs(fc) < tol else "tol_interval"
            return c, rows, "ok", stop
        if fa * fc < 0:
            b, fb = c, fc
        else:
            a, fa = c, fc
    return c, rows, "max_iter", "max_iter"


def false_position(f: Callable[[float], float], a: float, b: float, tol: float, max_iter: int) -> Solve4:
    fa, fb = f(a), f(b)
    if fa * fb > 0:
        raise ValueError("f(a) y f(b) deben tener signos opuestos para posición falsa.")
    rows: List[dict] = []
    c_prev = None
    for k in range(max_iter):
        c = (a * fb - b * fa) / (fb - fa)
        fc = f(c)
        err = abs(fc) if c_prev is None else abs(c - c_prev)
        if fa * fc < 0:
            accion = r"\text{se actualiza } b \leftarrow c"
        else:
            accion = r"\text{se actualiza } a \leftarrow c"
        paso = (
            f"{tex_step_header(k)}\\;"
            rf"c=\dfrac{{a\,f(b)-b\,f(a)}}{{f(b)-f(a)}}={tex_num(c)},\;"
            rf"f(c)={tex_num(fc)},\;"
            rf"\text{{error}}={tex_num(err)}.\;"
            f"{accion}"
        )
        rows.append(
            {
                "k": k,
                "a": a,
                "b": b,
                "f_a": fa,
                "f_b": fb,
                "c": c,
                "f_c": fc,
                "error": err,
                "aproximacion": c,
                "paso": paso,
            }
        )
        if abs(fc) < tol or err < tol:
            stop = "tol_abs_f" if abs(fc) < tol else "tol_step"
            return c, rows, "ok", stop
        if fa * fc < 0:
            b, fb = c, fc
        else:
            a, fa = c, fc
        c_prev = c
    return c, rows, "max_iter", "max_iter"


def newton(f: Callable[[float], float], df: Callable[[float], float], x0: float, tol: float, max_iter: int) -> Solve4:
    rows: List[dict] = []
    x = x0
    for k in range(max_iter):
        fx, dfx = f(x), df(x)
        if dfx == 0 or (isinstance(dfx, float) and math.isnan(dfx)):
            return x, rows, "zero_derivative", "zero_derivative"
        step = fx / dfx
        x_new = x - step
        err = abs(x_new - x)
        paso = (
            f"{tex_step_header(k)}\\;"
            rf"x_{{k}}={tex_num(x)},\;"
            rf"f(x_{{k}})={tex_num(fx)},\;"
            rf"f'(x_{{k}})={tex_num(dfx)},\;"
            rf"x_{{k+1}}=x_{{k}}-\dfrac{{f(x_{{k}})}}{{f'(x_{{k}})}}="
            rf"{tex_num(x)}-\dfrac{{{tex_num(fx)}}}{{{tex_num(dfx)}}}={tex_num(x_new)},\;"
            rf"|x_{{k+1}}-x_{{k}}|={tex_num(err)}"
        )
        rows.append(
            {
                "k": k,
                "x": x,
                "f_x": fx,
                "df_x": dfx,
                "x_next": x_new,
                "error": err,
                "aproximacion": x_new,
                "paso": paso,
            }
        )
        if abs(fx) < tol or err < tol:
            stop = "tol_abs_f" if abs(fx) < tol else "tol_step"
            return x_new, rows, "ok", stop
        x = x_new
    return x, rows, "max_iter", "max_iter"


def secant(f: Callable[[float], float], x0: float, x1: float, tol: float, max_iter: int) -> Solve4:
    rows: List[dict] = []
    x_prev, x = x0, x1
    f_prev, fx = f(x_prev), f(x)
    for k in range(max_iter):
        denom = fx - f_prev
        if denom == 0:
            return x, rows, "zero_denominator", "zero_denominator"
        x_new = x - fx * (x - x_prev) / denom
        err = abs(x_new - x)
        paso = (
            f"{tex_step_header(k)}\\;"
            rf"(x_{{k-1}},x_{{k}})=({tex_num(x_prev)},\,{tex_num(x)}),\;"
            rf"f(x_{{k-1}})={tex_num(f_prev)},\; f(x_{{k}})={tex_num(fx)},\;"
            rf"x_{{k+1}}=x_{{k}}-f(x_{{k}})\dfrac{{x_{{k}}-x_{{k-1}}}}{{f(x_{{k}})-f(x_{{k-1}})}}={tex_num(x_new)},\;"
            rf"|x_{{k+1}}-x_{{k}}|={tex_num(err)}"
        )
        rows.append(
            {
                "k": k,
                "x_prev": x_prev,
                "x": x,
                "f_prev": f_prev,
                "f_x": fx,
                "x_next": x_new,
                "error": err,
                "aproximacion": x_new,
                "paso": paso,
            }
        )
        if abs(fx) < tol or err < tol:
            stop = "tol_abs_f" if abs(fx) < tol else "tol_step"
            return x_new, rows, "ok", stop
        x_prev, f_prev, x, fx = x, fx, x_new, f(x_new)
    return x, rows, "max_iter", "max_iter"


def fixed_point(g: Callable[[float], float], x0: float, tol: float, max_iter: int) -> Solve4:
    rows: List[dict] = []
    x = x0
    for k in range(max_iter):
        x_new = g(x)
        err = abs(x_new - x)
        paso = (
            f"{tex_step_header(k)}\\;"
            rf"x_{{k}}={tex_num(x)},\;"
            rf"x_{{k+1}}=g(x_{{k}})={tex_num(x_new)},\;"
            rf"|x_{{k+1}}-x_{{k}}|={tex_num(err)}"
        )
        rows.append(
            {
                "k": k,
                "x": x,
                "g_x": x_new,
                "error": err,
                "aproximacion": x_new,
                "paso": paso,
            }
        )
        if err < tol:
            return x_new, rows, "ok", "tol_step"
        x = x_new
    return x, rows, "max_iter", "max_iter"


def bracket_root(f: Callable[[float], float], a: float, b: float, n: int = 64) -> Optional[Tuple[float, float]]:
    xs = np.linspace(a, b, n)
    ys = np.array([f(float(t)) for t in xs])
    for i in range(len(ys) - 1):
        if ys[i] == 0:
            return float(xs[i]), float(xs[i])
        if ys[i] * ys[i + 1] < 0:
            return float(xs[i]), float(xs[i + 1])
    return None
