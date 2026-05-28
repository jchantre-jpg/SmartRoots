export const COLS = {
  bisection: ['k', 'a', 'b', 'f_a', 'f_b', 'c', 'f_c', 'error', 'aproximacion'],
  false_position: ['k', 'a', 'b', 'f_a', 'f_b', 'c', 'f_c', 'error', 'aproximacion'],
  newton_raphson: ['k', 'x', 'f_x', 'df_x', 'x_next', 'error', 'aproximacion'],
  secant: ['k', 'x_prev', 'x', 'f_prev', 'f_x', 'x_next', 'error', 'aproximacion'],
  fixed_point: ['k', 'x', 'g_x', 'error', 'aproximacion'],
};

export const LABELS = {
  k: 'k',
  a: 'a',
  b: 'b',
  f_a: 'f(a)',
  f_b: 'f(b)',
  c: 'c',
  f_c: 'f(c)',
  f_x: 'f(x)',
  f_prev: 'f(xₖ₋₁)',
  x: 'xₖ',
  x_prev: 'xₖ₋₁',
  x_next: 'xₖ₊₁',
  df_x: "f'(x)",
  g_x: 'g(x)',
  error: 'Error',
  aproximacion: 'Aprox.',
};

export function fmtCell(v) {
  if (v == null) return '—';
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ax = Math.abs(v);
    if (ax !== 0 && (ax < 1e-6 || ax > 1e6)) return v.toExponential(3);
    return v.toPrecision(5);
  }
  return String(v);
}
