"""
SmartRoots — API HTTP (Flask).

Expone bajo el prefijo ``/api`` los métodos numéricos del curso: recomendación de método,
resolución de raíces, polinomios (Horner, división sintética, deflación) e interpolación
(Lagrange, Neville, Runge/Chebyshev). Incluye autenticación opcional vía ``/api/auth/*``.

Arranque: ``python app.py`` desde esta carpeta ``backend/``.
"""
from __future__ import annotations

import math
import os
from typing import Any, Dict, List, Optional

import numpy as np
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sympy import diff, lambdify

from interpolation import lagrange_detail, lagrange_eval, lagrange_sample, neville_table, runge_demo
from method_selector import recommend_for_expression, sample_curve
from polynomial import all_roots_deflation, horner_eval, horner_trace, synthetic_divide, synthetic_divide_trace
from root_methods import bisection, bracket_root, false_position, fixed_point, newton, secant

from auth_db import get_user_by_id, init_db, register_user, verify_login
from auth_validation import password_rule_checks
from auth_tokens import make_auth_token, parse_auth_token
from expr_convert import latex_to_sympy, sympy_to_latex
from user_math_errors import (
    coerce_optional_float,
    error_json,
    interpolation_hints,
    parse_coefficients_list,
    parse_g_expression,
    parse_roots_expression,
    polynomial_hints,
    require_float_field,
    require_optional_float,
    roots_hints,
    validate_interpolation_nodes,
)

app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=False,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"],
)
init_db()

# Interfaz web empaquetada para la app móvil (WebView → mismo host que /api, funciona con túnel).
_MOBILE_WEB_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "mobile", "assets", "web")
)


@app.get("/app/")
@app.get("/app/<path:filename>")
def mobile_web_app(filename: str = "index.html"):
    if not os.path.isdir(_MOBILE_WEB_DIR):
        return jsonify(error_json("Falta la web móvil. Ejecuta: cd SmartRoots/mobile && npm run build:mobile")), 404
    return send_from_directory(_MOBILE_WEB_DIR, filename)


def _auth_user_from_request():
    auth = request.headers.get("Authorization", "") or ""
    if not auth.lower().startswith("bearer "):
        return None
    token = auth.split(None, 1)[1].strip() if len(auth.split(None, 1)) > 1 else ""
    if not token:
        return None
    parsed = parse_auth_token(token)
    if not parsed:
        return None
    uid, _email = parsed
    return get_user_by_id(uid)

STOP_REASON_ES: Dict[str, str] = {
    "tol_abs_f": "|f(x)| < tolerancia",
    "tol_interval": "Mitad del intervalo < tolerancia (bisección)",
    "tol_step": "|xₖ₊₁ − xₖ| < tolerancia",
    "max_iter": "Se alcanzó el máximo de iteraciones",
    "zero_derivative": "f'(x) = 0 o no finito (Newton detenido)",
    "zero_denominator": "f(xₖ) = f(xₖ₋₁) en secante (denominador 0)",
}


def _parse(expr: str):
    return parse_roots_expression(expr)


def _api_error_response(exc: Exception, *, hints: Optional[List[str]] = None):
    if isinstance(exc, ValueError):
        return jsonify(error_json(str(exc), hints=hints)), 400
    return jsonify(
        error_json(
            "No se pudo completar el cálculo. Revisa los datos e inténtalo de nuevo.",
            hints=hints,
        )
    ), 400


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "app": "SmartRoots"})


@app.post("/api/expr/convert")
def api_expr_convert():
    """Convierte entre LaTeX (editor visual) y SymPy (motor numérico)."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        latex_in = data.get("latex")
        sympy_in = data.get("sympy")
        if latex_in is not None and str(latex_in).strip():
            sympy_out = latex_to_sympy(str(latex_in))
            return jsonify(
                {
                    "ok": True,
                    "sympy": sympy_out,
                    "latex": sympy_to_latex(sympy_out),
                }
            )
        if sympy_in is not None and str(sympy_in).strip():
            sympy_s = str(sympy_in).strip()
            parse_roots_expression(sympy_s)
            return jsonify(
                {
                    "ok": True,
                    "sympy": sympy_s,
                    "latex": sympy_to_latex(sympy_s),
                }
            )
        return jsonify({"ok": False, "error": "Envía «latex» o «sympy» en el cuerpo JSON."}), 400
    except ValueError as e:
        return jsonify(error_json(str(e), hints=roots_hints())), 400
    except Exception as e:
        return _api_error_response(e, hints=roots_hints())


def _user_json(user: dict) -> dict:
    return {
        "id": int(user["id"]),
        "email": user["email"],
        "username": user["username"],
        "full_name": user["full_name"],
    }


@app.post("/api/auth/register")
def auth_register():
    data = request.get_json(force=True, silent=True) or {}
    ok, msg, user, hint_labels = register_user(
        str(data.get("full_name", "")),
        str(data.get("email", "")),
        str(data.get("username", "")),
        str(data.get("password", "")),
        str(data.get("password_confirm", data.get("passwordConfirm", ""))),
    )
    if not ok or user is None:
        payload = {"ok": False, "error": msg}
        if hint_labels:
            payload["hints"] = hint_labels
        return jsonify(payload), 400
    uid = int(user["id"])
    token = make_auth_token(uid, user["email"])
    return jsonify({"ok": True, "token": token, "user": _user_json(user)})


@app.post("/api/auth/login")
def auth_login():
    data = request.get_json(force=True, silent=True) or {}
    username = str(data.get("username", data.get("email", ""))).strip()
    password = str(data.get("password", ""))
    ok, msg, user = verify_login(username, password)
    if not ok or user is None:
        return jsonify({"ok": False, "error": msg}), 401
    uid = int(user["id"])
    token = make_auth_token(uid, user["email"])
    return jsonify({"ok": True, "token": token, "user": _user_json(user)})


@app.get("/api/auth/password-rules")
def auth_password_rules():
    """Lista de reglas de contraseña para la UI (misma lógica que el registro)."""
    return jsonify(
        {
            "ok": True,
            "rules": [{"label": label, "key": label} for label, _ in password_rule_checks("")],
        }
    )


@app.get("/api/auth/me")
def auth_me():
    user = _auth_user_from_request()
    if not user:
        return jsonify({"ok": False, "error": "No autorizado"}), 401
    row = get_user_by_id(int(user["id"]))
    if not row:
        return jsonify({"ok": False, "error": "No autorizado"}), 401
    return jsonify({"ok": True, "user": _user_json(row)})


@app.post("/api/recommend")
def recommend():
    try:
        data = request.get_json(force=True, silent=True) or {}
        expr = str(data.get("expression", "x**2 - 2"))
        a = data.get("a")
        b = data.get("b")
        x0 = data.get("x0")
        x1 = data.get("x1")
        g_expression = data.get("g_expression")
        highlight_contractive = bool(data.get("highlight_contractive"))
        g_str = str(g_expression).strip() if g_expression is not None else None
        out = recommend_for_expression(
            expr,
            coerce_optional_float(a, "a"),
            coerce_optional_float(b, "b"),
            coerce_optional_float(x0, "x₀"),
            coerce_optional_float(x1, "x₁"),
            g_str if g_str else None,
            highlight_contractive,
        )
        return jsonify(out)
    except ValueError as e:
        return jsonify(error_json(str(e), hints=roots_hints())), 400
    except Exception as e:
        return _api_error_response(e, hints=roots_hints())


@app.post("/api/sample_curve")
def api_sample_curve():
    try:
        data = request.get_json(force=True, silent=True) or {}
        expr = str(data.get("expression", "x**2 - 2"))
        xmin = float(data.get("xmin", -3))
        xmax = float(data.get("xmax", 3))
        if xmin > xmax:
            xmin, xmax = xmax, xmin
        n = int(data.get("n", 200))
        n = max(16, min(n, 800))
        return jsonify(sample_curve(expr, xmin, xmax, n))
    except ValueError as e:
        return jsonify(error_json(str(e), hints=roots_hints())), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.post("/api/interval_sign")
def interval_sign():
    """f(a), f(b) y si hay cambio de signo (métodos de intervalo)."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        expr = str(data.get("expression", "x"))
        a = require_float_field(data, "a", "a (extremo del intervalo)")
        b = require_float_field(data, "b", "b (extremo del intervalo)")
        f_s, x = _parse(expr)
        fn = lambdify(x, f_s, modules=["numpy"])
        fa = float(fn(float(a)))
        fb = float(fn(float(b)))
        fa_ok = math.isfinite(fa)
        fb_ok = math.isfinite(fb)
        opposite = bool(fa_ok and fb_ok and fa * fb < 0)
        return jsonify(
            {
                "expression": expr,
                "a": a,
                "b": b,
                "f_a": fa,
                "f_b": fb,
                "finite_f_a": fa_ok,
                "finite_f_b": fb_ok,
                "opposite_signs": opposite,
            }
        )
    except ValueError as e:
        return jsonify(error_json(str(e), hints=roots_hints())), 400
    except Exception as e:
        return _api_error_response(e, hints=roots_hints())


@app.post("/api/solve")
def solve():
    try:
        data = request.get_json(force=True, silent=True) or {}
        method = str(data.get("method", "bisection"))
        tol = float(data.get("tol", 1e-8))
        max_iter = int(data.get("max_iter", 80))
        max_iter = max(8, min(max_iter, 600))
        expr = str(data.get("expression", "x**2 - 2"))

        f_s, x = _parse(expr)
        fn = lambdify(x, f_s, modules=["numpy"])
        d_s = diff(f_s, x)
        dfn = lambdify(x, d_s, modules=["numpy"])

        counts = {"f": 0, "df": 0, "g": 0}

        def f_w(v: float) -> float:
            counts["f"] += 1
            return float(fn(float(v)))

        def df_w(v: float) -> float:
            counts["df"] += 1
            return float(dfn(float(v)))

        root: float
        rows: List[dict]
        status: str
        stop_reason: str
        gn = None

        if method == "bisection":
            a = require_float_field(data, "a", "a (extremo del intervalo)")
            b = require_float_field(data, "b", "b (extremo del intervalo)")
            if a == b:
                raise ValueError("a y b deben ser distintos para bisección.")
            root, rows, status, stop_reason = bisection(f_w, a, b, tol, max_iter)
        elif method == "false_position":
            a = require_float_field(data, "a", "a (extremo del intervalo)")
            b = require_float_field(data, "b", "b (extremo del intervalo)")
            if a == b:
                raise ValueError("a y b deben ser distintos para posición falsa.")
            root, rows, status, stop_reason = false_position(f_w, a, b, tol, max_iter)
        elif method == "newton_raphson":
            x0 = require_optional_float(data, "x0")
            if x0 is None:
                x0 = 1.0
            root, rows, status, stop_reason = newton(f_w, df_w, x0, tol, max_iter)
        elif method == "secant":
            x0 = require_float_field(data, "x0", "x₀ (primera semilla)")
            x1 = require_float_field(data, "x1", "x₁ (segunda semilla)")
            if x0 == x1:
                raise ValueError("x₀ y x₁ deben ser distintos para la secante.")
            root, rows, status, stop_reason = secant(f_w, x0, x1, tol, max_iter)
        elif method == "fixed_point":
            g_expr = str(data.get("g_expression", "cos(x)"))
            g_s, _ = parse_g_expression(g_expr)
            gn = lambdify(x, g_s, modules=["numpy"])

            def g_w(v: float) -> float:
                counts["g"] += 1
                return float(gn(float(v)))

            x0 = require_optional_float(data, "x0")
            if x0 is None:
                x0 = 0.5
            root, rows, status, stop_reason = fixed_point(g_w, x0, tol, max_iter)
        else:
            return jsonify(
                error_json(
                    f"Método no soportado: {method}",
                    hints=[
                        "Métodos válidos: bisection, false_position, newton_raphson, secant, fixed_point.",
                    ],
                )
            ), 400

        residual_abs: Optional[float] = None
        if method == "fixed_point" and gn is not None:
            try:
                residual_abs = abs(float(root) - float(gn(float(root))))
            except Exception:
                residual_abs = None
        else:
            try:
                residual_abs = abs(float(fn(float(root))))
            except Exception:
                residual_abs = None

        diagnostics: List[str] = []
        if method == "newton_raphson" and rows:
            lr = rows[-1]
            dvx = lr.get("df_x")
            fvx = lr.get("f_x")
            try:
                if (
                    isinstance(dvx, (int, float))
                    and isinstance(fvx, (int, float))
                    and math.isfinite(float(dvx))
                    and math.isfinite(float(fvx))
                    and abs(float(dvx)) < 1e-8 * (1.0 + abs(float(root)))
                    and abs(float(fvx)) > tol * 40.0
                ):
                    diagnostics.append(
                        "Última iteración con |f'| muy pequeña e |f| aún moderada: posible raíz múltiple o mal condicionamiento para Newton."
                    )
            except Exception:
                pass

        labels = {
            "bisection": "Bisección",
            "false_position": "Posición falsa",
            "newton_raphson": "Newton–Raphson",
            "secant": "Secante",
            "fixed_point": "Punto fijo",
        }
        out: Dict[str, Any] = {
            "method": method,
            "method_label": labels.get(method, method),
            "expression": expr,
            "root": root,
            "status": status,
            "iterations": rows,
            "iterations_count": len(rows),
            "stop_reason": stop_reason,
            "stop_reason_label": STOP_REASON_ES.get(stop_reason, stop_reason),
            "eval_counts": dict(counts),
            "residual_abs": residual_abs,
            "residual_caption": "|f(r)| en la raíz aproximada" if method != "fixed_point" else "|r - g(r)| (punto fijo)",
            "diagnostics": diagnostics,
        }
        if method == "fixed_point":
            out["g_expression"] = str(data.get("g_expression", "cos(x)"))
        return jsonify(out)
    except ValueError as e:
        return jsonify(error_json(str(e), hints=roots_hints())), 400
    except Exception as e:
        return _api_error_response(e, hints=roots_hints())


@app.post("/api/polynomial/sample_curve")
def poly_sample_curve():
    """Muestreo de P(x) por Horner para graficar el polinomio."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        coeffs = parse_coefficients_list(data.get("coefficients", [1, 0, -2]))
        xmin = float(data.get("xmin", -4))
        xmax = float(data.get("xmax", 4))
        if xmin > xmax:
            xmin, xmax = xmax, xmin
        n = int(data.get("n", 360))
        n = max(32, min(n, 1200))
        xs = np.linspace(xmin, xmax, n)
        ys = [horner_eval(coeffs, float(t)) for t in xs]
        return jsonify(
            {
                "x": xs.tolist(),
                "y": ys,
                "coefficients_high_to_low": coeffs,
                "note": "Curva de P(x) por evaluación Horner.",
            }
        )
    except ValueError as e:
        return jsonify(error_json(str(e), hints=polynomial_hints())), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.post("/api/polynomial/horner")
def poly_horner():
    try:
        data = request.get_json(force=True, silent=True) or {}
        coeffs: List[float] = parse_coefficients_list(data.get("coefficients", [1, 0, -2]))
        xv = float(data.get("x", 1.5))
        val = horner_eval(coeffs, xv)
        q, rem = synthetic_divide(coeffs, xv)
        trace_h = horner_trace(coeffs, xv)
        syn_rows, rem2, _ = synthetic_divide_trace(coeffs, xv)
        return jsonify(
            {
                "coefficients_high_to_low": coeffs,
                "x": xv,
                "P_x": val,
                "synthetic_quotient": q,
                "remainder": rem,
                "remainder_synthetic_check": rem2,
                "horner_steps": trace_h,
                "synthetic_division_steps": syn_rows,
                "note": "Horner: evaluación anidada equivalente a división sintética por (x − x₀).",
            }
        )
    except ValueError as e:
        return jsonify(error_json(str(e), hints=polynomial_hints())), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.post("/api/polynomial/deflate_all")
def poly_deflate():
    try:
        data = request.get_json(force=True, silent=True) or {}
        coeffs = parse_coefficients_list(data.get("coefficients", [1, 0, -5, 0, 4]))
        guesses = data.get("guesses")
        glist = [float(g) for g in guesses] if guesses else None
        roots, log = all_roots_deflation(coeffs, guesses=glist)
        return jsonify(
            {
                "roots": roots,
                "deflation_log": log,
                "note": "Deflación con Horner: reduce el grado del polinomio tras cada raíz hallada.",
            }
        )
    except ValueError as e:
        return jsonify(error_json(str(e), hints=polynomial_hints())), 400
    except Exception as e:
        return _api_error_response(e, hints=polynomial_hints())


@app.post("/api/interpolation/lagrange_sample")
def interp_lagrange_sample():
    try:
        data = request.get_json(force=True, silent=True) or {}
        xs_nodes, ys_nodes = validate_interpolation_nodes(
            data.get("x_nodes", [-1, 0, 1, 2]),
            data.get("y_nodes", [2, 1, 2, 5]),
        )
        pad = float(data.get("pad_fraction", 0.12))
        n = int(data.get("n", 400))
        n = max(16, min(n, 1200))
        lo, hi = min(xs_nodes), max(xs_nodes)
        span = hi - lo if hi > lo else 1.0
        xmin = lo - pad * span
        xmax = hi + pad * span
        xf, yf = lagrange_sample(xs_nodes, ys_nodes, xmin, xmax, n=n)
        return jsonify(
            {
                "x": xf,
                "y": yf,
                "x_nodes": xs_nodes,
                "y_nodes": ys_nodes,
                "xmin": xmin,
                "xmax": xmax,
            }
        )
    except ValueError as e:
        return jsonify(error_json(str(e), hints=interpolation_hints())), 400
    except Exception as e:
        return _api_error_response(e, hints=interpolation_hints())


@app.post("/api/interpolation/lagrange")
def interp_lagrange():
    try:
        data = request.get_json(force=True, silent=True) or {}
        xs, ys = validate_interpolation_nodes(
            data.get("x_nodes", [-1, 0, 1, 2]),
            data.get("y_nodes", [2, 1, 2, 5]),
        )
        xv = require_float_field(data, "x", "x (punto a interpolar)")
        yv, terms = lagrange_detail(xs, ys, xv)
        return jsonify({"x_nodes": xs, "y_nodes": ys, "x": xv, "P_x": yv, "lagrange_terms": terms})
    except ValueError as e:
        return jsonify(error_json(str(e), hints=interpolation_hints())), 400
    except Exception as e:
        return _api_error_response(e, hints=interpolation_hints())


@app.post("/api/interpolation/neville")
def interp_neville():
    try:
        data = request.get_json(force=True, silent=True) or {}
        xs, ys = validate_interpolation_nodes(
            data.get("x_nodes", [0, 1, 3]),
            data.get("y_nodes", [1, 3, 2]),
        )
        xv = require_float_field(data, "x", "x (punto a interpolar)")
        val, table = neville_table(xs, ys, xv)
        return jsonify({"x_nodes": xs, "y_nodes": ys, "x": xv, "P_x": val, "table": table})
    except ValueError as e:
        return jsonify(error_json(str(e), hints=interpolation_hints())), 400
    except Exception as e:
        return _api_error_response(e, hints=interpolation_hints())


@app.get("/api/interpolation/weierstrass_runge")
def weierstrass_demo():
    try:
        n = int(request.args.get("n", 9))
        n = max(3, min(n, 40))
        return jsonify(runge_demo(n_nodes=n))
    except ValueError as e:
        return jsonify(error_json(str(e), hints=interpolation_hints())), 400
    except Exception as e:
        return _api_error_response(e, hints=interpolation_hints())


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=debug)
