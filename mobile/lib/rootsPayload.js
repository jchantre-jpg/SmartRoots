/** Construcción de POST /api/solve (igual que web). */

export function parseOptNum(s) {
  const t = String(s).trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

export function parseTolMax(f) {
  const raw = String(f.tolStr ?? '1e-10').trim().replace(',', '.');
  const tol = Number(raw);
  if (!Number.isFinite(tol) || tol <= 0) {
    return { ok: false, error: 'Tolerancia inválida (p. ej. 1e-10).' };
  }
  const mi = parseInt(String(f.maxIterStr ?? '120').trim(), 10);
  if (!Number.isFinite(mi) || mi < 8) {
    return { ok: false, error: 'Máx. iteraciones: entero ≥ 8.' };
  }
  if (mi > 600) return { ok: false, error: 'Máx. iteraciones ≤ 600.' };
  return { ok: true, tol, max_iter: mi };
}

export function buildSolvePayload(method, expression, fields, numeric) {
  const ex = expression.trim();
  const body = { method, expression: ex, tol: numeric.tol, max_iter: numeric.max_iter };
  const { a, b, x0, x1, gExpr } = fields;

  if (method === 'bisection' || method === 'false_position') {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) {
      return { ok: false, error: 'Para bisección/posición falsa, a y b deben ser números.' };
    }
    if (na === nb) return { ok: false, error: 'a y b deben ser distintos.' };
    body.a = na;
    body.b = nb;
    return { ok: true, body };
  }
  if (method === 'newton_raphson') {
    const nx = Number(x0);
    if (!Number.isFinite(nx)) return { ok: false, error: 'Introduce x₀ válido para Newton.' };
    body.x0 = nx;
    return { ok: true, body };
  }
  if (method === 'secant') {
    const s0 = Number(x0);
    const s1 = Number(x1);
    if (!Number.isFinite(s0) || !Number.isFinite(s1)) {
      return { ok: false, error: 'La secante necesita x₀ y x₁ numéricos.' };
    }
    if (s0 === s1) return { ok: false, error: 'x₀ y x₁ deben ser distintos.' };
    body.x0 = s0;
    body.x1 = s1;
    return { ok: true, body };
  }
  if (method === 'fixed_point') {
    const nx = Number(x0);
    if (!Number.isFinite(nx)) return { ok: false, error: 'Introduce x₀ para punto fijo.' };
    body.x0 = nx;
    body.g_expression = (gExpr || 'x').trim() || 'x';
    return { ok: true, body };
  }
  return { ok: false, error: 'Método no reconocido.' };
}
