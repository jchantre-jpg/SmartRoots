"""
Verificación exhaustiva: coherencia numérica y rutas HTTP (Flask test_client).
Ejecutar: python verify_exhaustive.py  (desde esta carpeta backend/)
"""
from __future__ import annotations

import math
import sys
from typing import Any, Callable, Dict, List, Tuple

# Imports de la app (misma carpeta)
from app import app
from interpolation import lagrange_detail, lagrange_eval, lagrange_sample, neville_table
from polynomial import horner_eval, horner_trace, synthetic_divide, synthetic_divide_trace

FAIL = 0


def ok(name: str, cond: bool, detail: str = "") -> None:
    global FAIL
    if cond:
        print(f"  OK  {name}")
    else:
        FAIL += 1
        print(f"  FAIL {name}" + (f"  ({detail})" if detail else ""))


def nearly_equal(a: float, b: float, tol: float = 1e-9) -> bool:
    return abs(a - b) <= tol * (1 + abs(a) + abs(b))


def test_pure_functions() -> None:
    print("-- Funciones puras (polinomio / interpolación)")
    coeffs = [1.0, 0.0, -2.0]  # x^2 - 2
    xv = 1.414213562
    pe = horner_eval(coeffs, xv)
    trace = horner_trace(coeffs, xv)
    ok("horner_trace último valor = P(x)", nearly_equal(trace[-1]["acumulado_despues"], pe))
    q, rem = synthetic_divide(coeffs, xv)
    ok("synthetic remainder = P(xv)", nearly_equal(rem, horner_eval(coeffs, xv)))
    ok("grado cociente = deg(P)-1", len(q) == len(coeffs) - 1)

    rows, rem2, b = synthetic_divide_trace(coeffs, xv)
    ok("synthetic_divide_trace rem == synthetic_divide rem", nearly_equal(rem2, rem))

    xs = [-1.0, 0.0, 1.0, 2.0]
    ys = [2.0, 1.0, 2.0, 5.0]
    xv2 = 0.35
    direct = lagrange_eval(xs, ys, xv2)
    total, terms = lagrange_detail(xs, ys, xv2)
    ssum = sum(float(t["termino"]) for t in terms)
    ok("lagrange_detail total == lagrange_eval", nearly_equal(total, direct))
    ok("suma términos == total", nearly_equal(ssum, total))
    nv, tab = neville_table(xs, ys, xv2)
    ok("Neville == Lagrange", nearly_equal(nv, direct, tol=1e-8))

    xf, yf = lagrange_sample(xs, ys, -0.5, 2.5, n=80)
    ok("lagrange_sample longitudes", len(xf) == len(yf) == 80)
    for xi, yi in zip(xs, ys):
        yi_curve = lagrange_eval(xs, ys, xi)
        ok(f"interp nodo ({xi})", nearly_equal(yi_curve, yi, tol=1e-10))

    # Runge demo estructura (sin HTTP)
    from interpolation import runge_demo

    d = runge_demo(9)
    ok("runge_demo len x == y_true", len(d["x"]) == len(d["y_true"]))
    ok("runge uniform poly len", len(d["uniform_nodes"]["poly_y"]) == len(d["x"]))


def _json(client, method: str, path: str, data: Dict[str, Any] | None = None) -> Tuple[int, Any]:
    if method == "GET":
        r = client.get(path)
    else:
        r = client.post(path, json=data or {})
    try:
        j = r.get_json(silent=True)
    except Exception:
        j = None
    return r.status_code, j


def test_http_routes() -> None:
    print("-- Rutas HTTP (test_client)")
    c = app.test_client()

    code, j = _json(c, "GET", "/api/health")
    ok("GET /api/health 200", code == 200 and j and j.get("status") == "ok")

    code, j = _json(
        c,
        "POST",
        "/api/recommend",
        {"expression": "x**2 - 2", "a": 1, "b": 2, "x0": 1.5, "x1": 2.0},
    )
    ok("POST /api/recommend", code == 200 and j and "recommended" in j)

    code, j = _json(
        c,
        "POST",
        "/api/interval_sign",
        {"expression": "x**2 - 2", "a": 1, "b": 2},
    )
    ok("POST /api/interval_sign", code == 200 and j and j.get("opposite_signs") is True)

    code, j = _json(
        c,
        "POST",
        "/api/sample_curve",
        {"expression": "x**2 - 2", "xmin": -2, "xmax": 2, "n": 50},
    )
    ok("sample_curve len", code == 200 and j and len(j.get("x", [])) == len(j.get("y", [])) >= 16)

    # Bisección: filas coherentes con f(x)=x^2-2
    def f_sq(v: float) -> float:
        return float(v) * float(v) - 2.0

    code, j = _json(
        c,
        "POST",
        "/api/solve",
        {"method": "bisection", "expression": "x**2 - 2", "a": 1, "b": 2, "tol": 1e-12, "max_iter": 80},
    )
    if code == 200 and j:
        rows = j.get("iterations") or []
        ok("bisection tiene iteraciones", len(rows) > 0)
        ok("bisection eval_counts", isinstance(j.get("eval_counts"), dict) and j["eval_counts"].get("f", 0) >= 2)
        ok("bisection stop_reason", bool(j.get("stop_reason")))
        ok("bisection residual", isinstance(j.get("residual_abs"), (int, float)))
        for i, row in enumerate(rows[:5]):
            fa = row.get("f_a")
            fb = row.get("f_b")
            a, b = row["a"], row["b"]
            ok(f"bis row{i} f_a", nearly_equal(fa, f_sq(a), tol=1e-6))
            ok(f"bis row{i} f_b", nearly_equal(fb, f_sq(b), tol=1e-6))
            ok(f"bis row{i} f_c", nearly_equal(row["f_c"], f_sq(row["c"]), tol=1e-6))
        root = float(j.get("root", 0))
        ok("bisection raíz ~ sqrt(2)", nearly_equal(root, math.sqrt(2), tol=1e-5))
    else:
        ok("bisection solve", False, str(j))

    code, j = _json(
        c,
        "POST",
        "/api/solve",
        {
            "method": "newton_raphson",
            "expression": "x**2 - 2",
            "x0": 2.0,
            "tol": 1e-12,
            "max_iter": 40,
        },
    )
    if code == 200 and j:
        root = float(j["root"])
        ok("Newton raíz", nearly_equal(root, math.sqrt(2), tol=1e-8))
        ok("Newton filas con paso", all("paso" in r for r in j.get("iterations", [])))
    else:
        ok("Newton solve", False, str(j))

    code, j = _json(
        c,
        "POST",
        "/api/solve",
        {
            "method": "secant",
            "expression": "x**2 - 2",
            "x0": 1.0,
            "x1": 2.0,
            "tol": 1e-12,
            "max_iter": 60,
        },
    )
    if code == 200 and j:
        ok("Secante raíz", nearly_equal(float(j["root"]), math.sqrt(2), tol=1e-7))
    else:
        ok("Secant solve", False, str(j))

    code, j = _json(
        c,
        "POST",
        "/api/solve",
        {"method": "false_position", "expression": "x**2 - 2", "a": 1, "b": 2, "tol": 1e-10, "max_iter": 80},
    )
    if code == 200 and j:
        ok("pos falsa raíz", nearly_equal(float(j["root"]), math.sqrt(2), tol=1e-5))
    else:
        ok("false_position solve", False, str(j))

    code, j = _json(
        c,
        "POST",
        "/api/solve",
        {
            "method": "fixed_point",
            "expression": "x**2 - 2",
            "g_expression": "0.5*(x + 2/x)",
            "x0": 1.5,
            "tol": 1e-10,
            "max_iter": 40,
        },
    )
    if code == 200 and j:
        root = float(j["root"])
        ok("punto fijo x=g(x)", nearly_equal(root, 0.5 * (root + 2 / root), tol=1e-6))
    else:
        ok("fixed_point solve", False, str(j))

    # Polinomio
    coeff = [1.0, 0.0, -5.0, 0.0, 4.0]
    code, j = _json(c, "POST", "/api/polynomial/horner", {"coefficients": coeff, "x": 1.2})
    if code == 200 and j:
        px_api = float(j["P_x"])
        px_direct = horner_eval(coeff, 1.2)
        ok("Horner API P_x", nearly_equal(px_api, px_direct))
        steps = j.get("horner_steps") or []
        ok("horner_steps último", len(steps) > 0 and nearly_equal(float(steps[-1]["acumulado_despues"]), px_direct))
        ok("remainder == P(x0)", nearly_equal(float(j["remainder"]), px_direct))
    else:
        ok("poly horner", False, str(j))

    code, j = _json(
        c,
        "POST",
        "/api/polynomial/sample_curve",
        {"coefficients": coeff, "xmin": -2, "xmax": 2, "n": 100},
    )
    if code == 200 and j:
        xs_, ys_ = j["x"], j["y"]
        ok("sample_curve poly len", len(xs_) == len(ys_) == 100)
        for t in (0.0, 0.37, -1.1):
            idx = min(range(len(xs_)), key=lambda i: abs(xs_[i] - t))
            ok(f"sample P({t:.2f})", nearly_equal(ys_[idx], horner_eval(coeff, xs_[idx]), tol=1e-5))
    else:
        ok("poly sample_curve", False, str(j))

    code, j = _json(c, "POST", "/api/polynomial/deflate_all", {"coefficients": coeff})
    if code == 200 and j:
        roots = j.get("roots") or []
        ok("deflación devuelve raíces", len(roots) >= 1)
        for r in roots:
            fr = horner_eval(coeff, float(r))
            ok("P(root) near 0 at " + format(float(r), ".4f"), abs(fr) < 2e-3, "f=" + repr(fr))
        for entry in j.get("deflation_log") or []:
            tr = entry.get("newton_trace") or []
            ok(f"traza Newton etapa {entry.get('deflation_step')}", isinstance(tr, list))
    else:
        ok("deflate_all", False, str(j))

    # Interpolación
    xn = [-1.0, 0.0, 1.0, 2.0]
    yn = [2.0, 1.0, 2.0, 5.0]
    xv = 0.5
    code, j = _json(c, "POST", "/api/interpolation/lagrange", {"x_nodes": xn, "y_nodes": yn, "x": xv})
    code2, j2 = _json(c, "POST", "/api/interpolation/neville", {"x_nodes": xn, "y_nodes": yn, "x": xv})
    if code == 200 and j and code2 == 200 and j2:
        yl, yn_ = float(j["P_x"]), float(j2["P_x"])
        ok("Lagrange vs Neville HTTP", nearly_equal(yl, yn_, tol=1e-8))
        terms = j.get("lagrange_terms") or []
        ok("lagrange_terms suma", nearly_equal(sum(float(t["termino"]) for t in terms), yl, tol=1e-8))
    else:
        ok("lagrange/neville HTTP", False, f"{j} {j2}")

    code, j = _json(
        c,
        "POST",
        "/api/interpolation/lagrange_sample",
        {"x_nodes": xn, "y_nodes": yn, "pad_fraction": 0.1, "n": 120},
    )
    if code == 200 and j:
        ok("lagrange_sample coords", len(j["x"]) == len(j["y"]) == 120)
    else:
        ok("lagrange_sample", False, str(j))

    code, j = _json(c, "GET", "/api/interpolation/weierstrass_runge?n=7")
    if code == 200 and j:
        ok("runge GET estructura", "uniform_nodes" in j and len(j["x"]) == len(j["y_true"]))
    else:
        ok("weierstrass_runge GET", False, str(j))


def main() -> int:
    print("SmartRoots — verificación exhaustiva\n")
    test_pure_functions()
    test_http_routes()
    print()
    if FAIL:
        print(f"Terminado con {FAIL} fallos.")
        return 1
    print("Todo OK: coherencia numérica y rutas principales verificadas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
