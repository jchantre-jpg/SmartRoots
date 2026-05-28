"""
Notación matemática (LaTeX) para trazas paso a paso en la API.
"""
from __future__ import annotations

import math
import re
from typing import Union

Num = Union[float, int, None]


def tex_num(x: Num) -> str:
    """Formatea un escalar para KaTeX."""
    if x is None:
        return r"\text{—}"
    if isinstance(x, float) and (math.isnan(x) or math.isinf(x)):
        return r"\text{—}"
    v = float(x)
    if v == 0.0:
        return "0"
    ax = abs(v)
    if ax >= 1e6 or (0 < ax < 1e-4):
        exp = int(math.floor(math.log10(ax)))
        mant = v / (10**exp)
        mant_s = f"{mant:.10g}"
        return rf"{mant_s} \times 10^{{{exp}}}"
    return f"{v:.10g}"


def tex_step_header(k: int) -> str:
    """Encabezado «Paso k» en negrita."""
    return rf"\textbf{{Paso {k + 1}:}}"


def looks_like_latex(s: str) -> bool:
    return bool(s and re.search(r"\\[a-zA-Z]|\\frac|_\{|\\text|\\Rightarrow", s))
