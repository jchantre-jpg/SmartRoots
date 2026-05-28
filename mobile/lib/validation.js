/** Validación de entradas (alineada con frontend/src/lib/parseCoefficientsInput.js). */

function tokenLooksLikeExpression(s) {
  const t = String(s).trim();
  if (/[xX]/.test(t)) return true;
  if (/\*\*|[\^]/.test(t)) return true;
  if (/\b(sin|cos|tan|log|ln|sqrt|exp|pi)\b/i.test(t)) return true;
  if (/[()]/.test(t)) return true;
  if (/[a-df-wyzA-DF-WYZ]/.test(t)) return true;
  return false;
}

export function parseCoefficientsInput(raw) {
  const str = String(raw ?? '').trim();
  if (!str) {
    return {
      ok: false,
      values: [],
      message: 'Ingresa los coeficientes del polinomio (al menos uno).',
      hint: 'Formato: números separados por coma, de mayor a menor grado.',
    };
  }
  const parts = str.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) {
    return { ok: false, values: [], message: 'No se detectaron coeficientes.', hint: 'Ejemplo: 1, 0, -5, 0, 4' };
  }
  if (parts.length === 1 && tokenLooksLikeExpression(parts[0])) {
    return {
      ok: false,
      values: [],
      message: 'Parece una expresión f(x), no coeficientes.',
      hint: 'En Polinomios solo números. Para ecuaciones usa Raíces.',
    };
  }
  const values = parts.map((p) => Number(p));
  const badIdx = values.findIndex((n) => Number.isNaN(n));
  if (badIdx !== -1) {
    const bad = parts[badIdx];
    if (tokenLooksLikeExpression(bad)) {
      return {
        ok: false,
        values: [],
        message: `«${bad.slice(0, 40)}» no es un coeficiente numérico.`,
        hint: 'Solo números en Polinomios; expresiones con x → pestaña Raíces.',
      };
    }
    return { ok: false, values: [], message: 'Cada coeficiente debe ser un número válido.', hint: '' };
  }
  if (values.length > 120) {
    return { ok: false, values: [], message: 'Demasiados coeficientes (máx. 120).', hint: '' };
  }
  return { ok: true, values, message: '', hint: '' };
}

function splitTokens(raw) {
  return String(raw ?? '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function validateInterpNodes(nodesX, nodesY) {
  const tx = splitTokens(nodesX);
  const ty = splitTokens(nodesY);
  const xa = tx.map((t) => Number(t));
  const ya = ty.map((t) => Number(t));

  const nxBad = tx.findIndex((t) => Number.isNaN(Number(t)));
  const nyBad = ty.findIndex((t) => Number.isNaN(Number(t)));
  if (nxBad !== -1 || nyBad !== -1) {
    const badTok = nxBad !== -1 ? tx[nxBad] : ty[nyBad];
    const looksExpr = tokenLooksLikeExpression(badTok);
    return {
      ok: false,
      message: looksExpr
        ? `«${badTok.slice(0, 36)}» no es un número (parece fórmula).`
        : 'Todos los nodos deben ser números válidos.',
      hint: looksExpr
        ? 'Interpolación usa tablas (xᵢ, yᵢ). Para f(x) usa Raíces.'
        : 'Usa punto decimal, no coma como separador decimal.',
    };
  }
  if (xa.length !== ya.length) {
    return {
      ok: false,
      message: `Misma cantidad de nodos x e y (${xa.length} vs ${ya.length}).`,
      hint: 'Cada par (xᵢ, yᵢ) debe alinearse en orden.',
    };
  }
  if (xa.length < 2) {
    return { ok: false, message: 'Se necesitan al menos 2 nodos.', hint: 'Ej: x = -1,0,1 y tres valores y.' };
  }
  const seen = new Set();
  for (const xv of xa) {
    const k = String(xv);
    if (seen.has(k)) {
      return { ok: false, message: 'Los nodos x deben ser distintos.', hint: 'No repitas la misma abscisa.' };
    }
    seen.add(k);
  }
  return { ok: true, message: '', hint: '', xs: xa, ys: ya };
}

export function formatValidationError(check) {
  if (!check?.message) return '';
  return check.hint ? `${check.message}\n\n• ${check.hint}` : check.message;
}
