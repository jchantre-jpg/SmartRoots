"""
Interpolación polinómica para SmartRoots (Lagrange, Neville, demo de Runge).

Ideas clave para el alumno:
    - Dados nodos (x_i, y_i) distintos, existe un único polinomio de grado ≤ n−1 que pasa por ellos.
    - **Lagrange** escribe ese polinomio como suma de bases L_i(x) que valen 1 en x_i y 0 en los demás nodos.
    - **Neville** construye la misma interpolación de forma recursiva en tabla (útil en papel y en código estable).
    - **Fenómeno de Runge**: con nodos **uniformes**, el interpolante puede oscilar mucho cerca de los extremos
      del intervalo aunque la función sea suave; nodos **Chebyshev** suelen reducir ese efecto.

Requisitos numéricos:
    Los x_i deben ser distintos entre sí; si dos x coinciden, las fórmulas dividen por cero.
"""
from __future__ import annotations

from typing import Dict, List, Sequence, Tuple

import numpy as np


# =============================================================================
# Lagrange: evaluación y desglose pedagógico
# =============================================================================


def lagrange_eval(xs: Sequence[float], ys: Sequence[float], x: float) -> float:
    """
    Evalúa el polinomio interpolante de Lagrange P(x) que cumple P(x_i) = y_i.

    Fórmula: P(x) = Σ_i y_i · L_i(x), donde L_i es el producto de (x − x_j)/(x_i − x_j) para j ≠ i.

    Args:
        xs: abscisas de los nodos (longitud n), todas distintas.
        ys: ordenadas en esos nodos.
        x: punto donde interpolar (puede estar fuera del hull de nodos: es extrapolación).

    Returns:
        P(x) como float.
    """
    n = len(xs)
    total = 0.0
    for i in range(n):
        term = float(ys[i])
        for j in range(n):
            if j == i:
                continue
            term *= (x - xs[j]) / (xs[i] - xs[j])
        total += term
    return total


def lagrange_detail(xs: Sequence[float], ys: Sequence[float], x: float) -> Tuple[float, List[Dict[str, float]]]:
    """
    Igual que ``lagrange_eval`` pero devuelve también el desglose por nodo para la UI.

    Para cada i: L_i(x) (peso de Lagrange) y el término y_i·L_i(x) que suma al total.

    Returns:
        ``(P(x), lista_de_términos)`` — cada dict tiene índice humano 1-based, x_i, y_i, L_i, término.
    """
    n = len(xs)
    terms: List[Dict[str, float]] = []
    total = 0.0
    for i in range(n):
        L = 1.0
        for j in range(n):
            if j == i:
                continue
            L *= (x - xs[j]) / (xs[i] - xs[j])
        yi = float(ys[i])
        contrib = yi * L
        total += contrib
        terms.append(
            {
                "i": i + 1,
                "x_i": float(xs[i]),
                "y_i": yi,
                "L_i_en_x": float(L),
                "termino": float(contrib),
            }
        )
    return total, terms


def lagrange_sample(
    xs: Sequence[float],
    ys: Sequence[float],
    xmin: float,
    xmax: float,
    n: int = 400,
) -> Tuple[List[float], List[float]]:
    """
    Muestrea el interpolante de Lagrange en ``n`` puntos equiespaciados de [xmin, xmax].

    Sirve para dibujar la curva del polinomio frente a la función verdadera (p. ej. en Runge).
    ``n`` se recorta al rango [32, 2000] para no colgar el servidor ni perder suavidad.
    """
    if xmin > xmax:
        xmin, xmax = xmax, xmin
    n = max(32, min(int(n), 2000))
    xf = np.linspace(float(xmin), float(xmax), n)
    yf = [lagrange_eval(xs, ys, float(t)) for t in xf]
    return xf.tolist(), yf


# =============================================================================
# Neville: tabla Q[i,j] = interpolante en nodos x_i..x_{i+j} evaluado en x
# =============================================================================


def neville_table(xs: Sequence[float], ys: Sequence[float], x: float) -> Tuple[float, List[List[float]]]:
    """
    Algoritmo de Neville: construye la tabla Q donde Q[i][0] = y_i y cada columna sube un grado.

    Recurrencia (j ≥ 1):
        Q[i][j] = ((x_{i+j} − x)·Q[i][j−1] + (x − x_i)·Q[i+1][j−1]) / (x_{i+j} − x_i)

    El valor buscado del interpolante de grado n−1 en x es Q[0][n−1].

    Returns:
        ``(valor_P(x), tabla_completa)`` — ``tabla`` es lista de filas; la celda [i][j] es real.
    """
    n = len(xs)
    q = [[0.0] * n for _ in range(n)]
    for i in range(n):
        q[i][0] = float(ys[i])
    for j in range(1, n):
        for i in range(n - j):
            q[i][j] = ((xs[i + j] - x) * q[i][j - 1] + (x - xs[i]) * q[i + 1][j - 1]) / (xs[i + j] - xs[i])
    return q[0][n - 1], q


# =============================================================================
# Demo Runge: nodos uniformes vs Chebyshev en [-1, 1]
# =============================================================================


def runge_demo(
    n_nodes: int = 9,
) -> dict:
    """
    Compara interpolación de la función de Runge f(x) = 1/(1+25x²) en [-1, 1].

    Construye:
        - Malla fina ``x`` y valores exactos ``y_true`` para dibujar f.
        - Polinomio con nodos **uniformes** en [-1,1] (suele mostrar overshoot cerca de ±1).
        - Polinomio con nodos **Chebyshev** (proyección de nodos óptimos en sentido mini-max).
        - Métricas: error máximo y RMS en la malla, y error en un punto de prueba x=0.5.

    Contexto teórico (Weierstrass): cualquier continua en un compacto se puede aproximar uniformemente
    por polinomios, pero **no** dice que el interpolante con nodos equiespaciados sea bueno en práctica.

    Args:
        n_nodes: número de nodos de interpolación (grado del polinomio ≤ n_nodes − 1).

    Returns:
        Dict listo para JSON con curvas, nodos y ``metrics`` numéricas.
    """
    def f_true(xx: np.ndarray) -> np.ndarray:
        return 1.0 / (1.0 + 25.0 * xx**2)

    x_fine = np.linspace(-1, 1, 400)
    y_true = f_true(x_fine)
    nodes_u = np.linspace(-1, 1, n_nodes)
    y_nodes_u = f_true(nodes_u)
    y_poly_u = np.array([lagrange_eval(nodes_u, y_nodes_u, float(t)) for t in x_fine])

    # Nodos Chebyshev de primer tipo en [-1,1]: x_k = cos((2k+1)π/(2n)), k=0..n-1
    # Se concentran cerca de los extremos y suelen mitigar el fenómeno de Runge.
    k = np.arange(n_nodes)
    nodes_c = np.cos((2 * k + 1) * np.pi / (2 * n_nodes))
    y_nodes_c = f_true(nodes_c)
    y_poly_c = np.array([lagrange_eval(nodes_c, y_nodes_c, float(t)) for t in x_fine])

    yt = np.asarray(y_true, dtype=float)
    err_u = float(np.max(np.abs(yt - y_poly_u)))
    err_c = float(np.max(np.abs(yt - y_poly_c)))
    l2_u = float(np.sqrt(np.mean((yt - y_poly_u) ** 2)))
    l2_c = float(np.sqrt(np.mean((yt - y_poly_c) ** 2)))

    x_probe = 0.5
    t_probe = float(1.0 / (1.0 + 25.0 * x_probe**2))
    u_probe = float(lagrange_eval(nodes_u, y_nodes_u, x_probe))
    c_probe = float(lagrange_eval(nodes_c, y_nodes_c, x_probe))

    return {
        "function": "1/(1+25x^2)",
        "weierstrass_note": "Cualquier función continua en un intervalo cerrado puede aproximarse uniformemente por polinomios; la elección de nodos afecta mucho el error práctico.",
        "x": x_fine.tolist(),
        "y_true": y_true.tolist(),
        "uniform_nodes": {
            "x": nodes_u.tolist(),
            "y": y_nodes_u.tolist(),
            "poly_y": y_poly_u.tolist(),
        },
        "chebyshev_nodes": {
            "x": nodes_c.tolist(),
            "y": y_nodes_c.tolist(),
            "poly_y": y_poly_c.tolist(),
        },
        "metrics": {
            "n_nodes": int(n_nodes),
            "n_samples": int(len(x_fine)),
            "max_abs_error_uniform": err_u,
            "max_abs_error_chebyshev": err_c,
            "rms_error_uniform": l2_u,
            "rms_error_chebyshev": l2_c,
            "x_probe": x_probe,
            "true_at_probe": t_probe,
            "abs_error_uniform_at_probe": abs(t_probe - u_probe),
            "abs_error_chebyshev_at_probe": abs(t_probe - c_probe),
        },
    }
