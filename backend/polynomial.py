"""
Matemática polinómica para SmartRoots (API educativa).

Convención de coeficientes (como en álgebra / muchos libros de métodos numéricos):
    P(x) = a_n·x^n + a_{n-1}·x^{n-1} + … + a_1·x + a_0

    La lista ``coeffs`` es ``[a_n, a_{n-1}, …, a_0]`` — índice 0 = término de mayor grado.

Contenido del módulo (orden de lectura sugerido):
    1. Horner: evaluar P(x) y P'(x) de forma estable y barata (O(n)).
    2. División sintética: dividir P(x) entre (x − r); si el residuo ≈ 0, r es raíz.
    3. Newton–Horner: Newton–Raphson usando Horner para f y f' (reutiliza ``root_methods.newton``).
    4. Deflación: tras hallar una raíz, factorizar (x−r) y repetir en el cociente (solo raíces reales).

Limitaciones honestas:
    ``all_roots_deflation`` es heurístico (semillas en [-10,10] o ``guesses``); raíces complejas,
    multiplicidad > 1 o mal condicionamiento pueden dar resultados incompletos o inestables.
"""
from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import numpy as np

from math_step_tex import tex_num
from root_methods import newton


# =============================================================================
# Horner: evaluación y derivada
# =============================================================================


def horner_eval(coeffs: List[float], x: float) -> float:
    """
    Evalúa P(x) con el esquema de Horner (sin formar potencias explícitas de x).

    Idea: reescribir de dentro hacia afuera, p. ej. ax²+bx+c = ((a)·x + b)·x + c.
    Complejidad O(n) en el grado; numéricamente suele ser más estable que sumar monomios sueltos.

    Args:
        coeffs: [a_n, …, a_0] como arriba.
        x: punto donde evaluar.

    Returns:
        Valor escalar P(x).
    """
    r = 0.0
    for c in coeffs:
        r = r * x + float(c)
    return r


def horner_trace(coeffs: List[float], x: float) -> List[Dict[str, object]]:
    """
    Igual que ``horner_eval`` pero devuelve cada paso intermedio para mostrarlo en la UI.

    Cada elemento del resultado es un paso: coeficiente usado, acumulado antes/después,
    y una línea de texto legible para el alumno.
    """
    r = 0.0
    steps: List[Dict[str, object]] = []
    for k, c in enumerate(coeffs):
        prev = r
        r = r * x + float(c)
        steps.append(
            {
                "paso": k + 1,
                "coeficiente": float(c),
                "acumulado_antes": prev,
                "acumulado_despues": r,
                "texto": (
                    rf"r \leftarrow ({tex_num(prev)})\cdot({tex_num(x)})+({tex_num(float(c))})"
                    rf"={tex_num(r)}"
                ),
            }
        )
    return steps


def horner_derivative_coeffs(coeffs: List[float]) -> List[float]:
    """
    Coeficientes del polinomio derivado P'(x) en el mismo orden [mayor grado … constante].

    Regla: si P(x) = Σ a_i x^i con i bajando en la lista, entonces el término a_k (asociado
    al grado que corresponde a la posición k en nuestra convención) contribuye
    (grado)·coef al derivado. Aquí ``power`` es el exponente del término actual al recorrer
    de a_n hacia a_1 (el término constante a_0 desaparece en la derivada).
    """
    n = len(coeffs) - 1
    if n <= 0:
        return []
    out: List[float] = []
    for i, c in enumerate(coeffs[:-1]):
        power = n - i  # grado del monomio asociado a coeffs[i]
        out.append(float(c) * power)
    return out


# =============================================================================
# División sintética por (x − root)
# =============================================================================


def synthetic_divide(coeffs: List[float], root: float) -> Tuple[List[float], float]:
    """
    Divide P(x) entre (x − root) cuando ``coeffs`` describe P en orden [a_n, …, a_0].

    Algoritmo clásico de división sintética: construye los coeficientes b_0…b_{n-1}
    del cociente Q de grado n−1 y el residuo R tal que P(x) = (x−root)·Q(x) + R.
    Si R = 0, entonces ``root`` es raíz exacta (en aritmética exacta).

    Returns:
        Tupla ``(coeficientes_del_cociente, residuo)``. El cociente tiene longitud n si P tenía grado n.
    """
    if not coeffs:
        raise ValueError("coeficientes vacíos")
    a = [float(c) for c in coeffs]
    if len(a) < 2:
        # grado 0: no hay cociente lineal en (x−root); "residuo" es el propio valor constante
        return [], a[0] if a else 0.0
    n = len(a) - 1
    b = [0.0] * n
    b[0] = a[0]
    for i in range(1, n):
        b[i] = a[i] + root * b[i - 1]
    remainder = a[n] + root * b[n - 1]
    return b, remainder


def synthetic_divide_trace(coeffs: List[float], root: float) -> Tuple[List[Dict[str, object]], float, List[float]]:
    """
    División sintética con trazas paso a paso (tabla tipo curso).

    Returns:
        ``(filas_explicadas, residuo, coeficientes_del_cociente)`` — las filas alimentan tablas en el front.
    """
    if not coeffs:
        raise ValueError("coeficientes vacíos")
    a = [float(c) for c in coeffs]
    if len(a) < 2:
        return [], a[0] if a else 0.0, []
    n = len(a) - 1
    b = [0.0] * n
    rows: List[Dict[str, object]] = []
    b[0] = a[0]
    rows.append(
        {
            "paso": 1,
            "texto": rf"b_0 = a_0 = {tex_num(a[0])}",
            "b_actual": b[0],
        }
    )
    for i in range(1, n):
        prev = b[i - 1]
        b[i] = a[i] + root * prev
        rows.append(
            {
                "paso": i + 1,
                "texto": (
                    rf"b_{{{i}}} = a_{{{i}}} + ({tex_num(root)})\,b_{{{i - 1}}} "
                    rf"= {tex_num(a[i])} + ({tex_num(root)})\cdot({tex_num(prev)}) "
                    rf"= {tex_num(b[i])}"
                ),
                "b_actual": b[i],
            }
        )
    remainder = a[n] + root * b[n - 1]
    rows.append(
        {
            "paso": n + 1,
            "texto": (
                rf"P({tex_num(root)}) = a_{{{n}}} + ({tex_num(root)})\,b_{{{n - 1}}} "
                rf"= {tex_num(a[n])} + ({tex_num(root)})\cdot({tex_num(b[n - 1])}) "
                rf"= {tex_num(remainder)}"
            ),
            "residuo": remainder,
        }
    )
    return rows, remainder, b


def deflate_once(coeffs: List[float], root: float, tol: float = 1e-6) -> List[float]:
    """
    Un paso de deflación: divide P por (x − root) y devuelve el cociente (grado una unidad menor).

    En coma flotante el residuo casi nunca es exactamente 0; aun así se usa el cociente como
    aproximación estándar en cadenas de deflación. El chequeo ``abs(rem) > tol`` queda como
    ancla futura si se quiere advertir al usuario de mala condición; hoy se ignora a propósito.
    """
    q, rem = synthetic_divide(coeffs, root)
    if abs(rem) > tol * (1 + abs(root)):
        # Residuo grande: la "raíz" podría ser mala o hay error numérico; igual devolvemos q.
        pass
    return q


# =============================================================================
# Newton con Horner + deflación encadenada
# =============================================================================


def newton_horner(
    coeffs: List[float],
    x0: float,
    tol: float,
    max_iter: int,
) -> Tuple[float, List[dict], str]:
    """
    Newton–Raphson sobre P(x)=0 evaluando P y P' vía Horner (rápido y coherente con el curso).

    Caso degenerado grado 1: raíz cerrada −a₀/a₁ sin iterar.
    Caso general: delegamos en ``newton`` de ``root_methods`` con closures f/df basadas en Horner.

    Returns:
        ``(raíz_aproximada, filas_iteración, estado)`` donde estado sigue la convención de ``newton``.
    """
    if len(coeffs) == 2:
        a, b0 = coeffs[0], coeffs[1]
        if abs(a) < 1e-15:
            return x0, [], "degenerate"
        r = -b0 / a
        fx0 = horner_eval(coeffs, x0)
        row = {
            "k": 0,
            "x": x0,
            "f_x": fx0,
            "df_x": a,
            "x_next": r,
            "error": abs(r - x0),
            "aproximacion": r,
            "paso": (
                rf"\text{{Polinomio lineal: }}\; P(x)={tex_num(a)}\,x+({tex_num(b0)});\;"
                rf"r=-\dfrac{{{tex_num(b0)}}}{{{tex_num(a)}}}={tex_num(r)}"
            ),
        }
        return r, [row], "ok"

    d_coeffs = horner_derivative_coeffs(coeffs)

    def f(x: float) -> float:
        return horner_eval(coeffs, x)

    def df(x: float) -> float:
        return horner_eval(d_coeffs, x) if d_coeffs else 0.0

    root, rows, status, _ = newton(f, df, x0, tol, max_iter)
    return root, rows, status


def all_roots_deflation(
    coeffs: List[float],
    guesses: Optional[List[float]] = None,
    tol: float = 1e-7,
    max_roots: int = 32,
) -> Tuple[List[float], List[dict]]:
    """
    Intenta hallar varias raíces reales en cadena: Newton–Horner + deflación repetida.

    Flujo por cada raíz nueva:
        1. Elegir semilla x0 (de ``guesses`` por orden, o barrido en [-10,10] minimizando |P(x)|).
        2. ``newton_horner`` hasta convergencia o corte.
        3. Añadir raíz a la lista y reemplazar P por el cociente de ``deflate_once``.

    Se detiene si el método falla (estado no ok/max_iter), se alcanza ``max_roots``, o el grado baja a 1.

    Args:
        coeffs: P en orden [a_n, …, a_0].
        guesses: semillas opcionales por raíz (primera raíz usa guesses[0], etc.).
        tol: tolerancia pasada a Newton y deflación.
        max_roots: tope de seguridad para no iterar sin fin.

    Returns:
        ``(lista_de_raíces, log)`` — ``log`` contiene por paso coeficientes, traza de Newton, etc.
    """
    roots: List[float] = []
    log: List[dict] = []
    c = [float(v) for v in coeffs]
    if len(c) == 2 and abs(c[0]) > 1e-14:
        roots.append(-c[1] / c[0])
        return roots, log

    while len(c) > 1 and len(roots) < max_roots:
        deg = len(c) - 1
        if deg == 0:
            break
        x0 = 0.0
        if guesses and len(roots) < len(guesses):
            x0 = float(guesses[len(roots)])
        else:
            # Heurística simple: entre 41 puntos equiespaciados, elegir el que minimiza |P(x)|
            best = None
            best_f = float("inf")
            for t in np.linspace(-10, 10, 41):
                fv = abs(horner_eval(c, float(t)))
                if fv < best_f:
                    best_f = fv
                    best = float(t)
            x0 = best if best is not None else 0.0
        r, rows, status = newton_horner(c, x0, tol, 80)
        log.append(
            {
                "deflation_step": len(roots),
                "coeffs_degree": deg,
                "start": x0,
                "root": r,
                "status": status,
                "newton_trace": rows,
            }
        )
        if status not in ("ok", "max_iter"):
            break
        roots.append(r)
        if len(c) <= 2:
            break
        c = deflate_once(c, r, tol=tol)
    return roots, log
