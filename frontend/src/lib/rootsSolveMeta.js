/**
 * Metadatos para comparar métodos (costes aproximados, errores, acuerdo de raíz).
 * Los costes siguen la implementación en ``SmartRoots/backend/root_methods.py`` (orden de magnitud).
 */

/** @param {string} method */
export function estimateEvalCost(method, iterationsCount) {
  const n = Math.max(0, iterationsCount | 0)
  switch (method) {
    case 'bisection':
    case 'false_position':
      return { f: 2 + n, df: 0, g: 0, note: '2·f al inicio + 1·f por iteración (aprox.).' }
    case 'newton_raphson':
      return { f: 2 * n, df: 2 * n, g: 0, note: '1·f y 1·f′ por iteración (aprox.).' }
    case 'secant':
      return { f: 2 + n, df: 0, g: 0, note: '2·f al inicio + 1·f nueva por iteración (aprox.).' }
    case 'fixed_point':
      return { f: 0, df: 0, g: n, note: '1·g por iteración (aprox.).' }
    default:
      return { f: 0, df: 0, g: 0, note: '' }
  }
}

export function lastFiniteErrorFromIterations(rows) {
  if (!rows?.length) return null
  for (let i = rows.length - 1; i >= 0; i--) {
    const e = rows[i]?.error
    if (typeof e === 'number' && Number.isFinite(e)) return e
  }
  return null
}

/** Resume una fila de compareAllMethods ({ id, label, ok, data?, error? }). */
export function summarizeCompareRow(row) {
  if (!row?.ok || !row.data) {
    return {
      id: row?.id,
      label: row?.label,
      ok: false,
      status: null,
      root: null,
      iters: 0,
      cost: { f: 0, df: 0, g: 0, note: '' },
      lastErr: null,
      residual: null,
      stopReason: null,
      stopReasonLabel: null,
      note: row?.error ? String(row.error).slice(0, 140) : '—',
    }
  }
  const d = row.data
  const iters = d.iterations_count ?? d.iterations?.length ?? 0
  const ec = d.eval_counts
  const cost = ec
    ? {
        f: Number(ec.f) || 0,
        df: Number(ec.df) || 0,
        g: Number(ec.g) || 0,
        note: 'Conteo real en el servidor durante la iteración.',
      }
    : estimateEvalCost(d.method || row.id, iters)
  const residual =
    typeof d.residual_abs === 'number' && Number.isFinite(d.residual_abs) ? d.residual_abs : null
  const parts = []
  if (d.status === 'ok') parts.push('Convergencia declarada')
  else parts.push(`Estado: ${d.status}`)
  if (d.stop_reason_label) parts.push(String(d.stop_reason_label))
  return {
    id: row.id,
    label: row.label,
    ok: true,
    status: d.status,
    root: typeof d.root === 'number' && Number.isFinite(d.root) ? d.root : null,
    iters,
    cost,
    lastErr: lastFiniteErrorFromIterations(d.iterations),
    residual,
    stopReason: d.stop_reason,
    stopReasonLabel: d.stop_reason_label,
    note: parts.join(' · '),
  }
}

/** Raíces de filas ok con status ok; para ver si los métodos “coinciden”. */
export function rootAgreementStats(rows) {
  const roots = (rows || [])
    .filter((r) => r.ok && r.data?.status === 'ok' && typeof r.data.root === 'number' && Number.isFinite(r.data.root))
    .map((r) => r.data.root)
  if (!roots.length) return { count: 0, spread: null, median: null, agree: null }
  const sorted = [...roots].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const spread = sorted[sorted.length - 1] - sorted[0]
  const tol = 1e-6 * (1 + Math.abs(median))
  const agree = spread <= 8 * tol
  return { count: roots.length, spread, median, agree }
}

/**
 * Puntuación baja = mejor (solo entre filas convergentes status ok).
 * Penaliza iteraciones y evaluaciones; bonus si error final muy pequeño.
 */
export function compareScore(summ) {
  if (!summ.ok || summ.status !== 'ok') return Number.POSITIVE_INFINITY
  const err = summ.lastErr != null && summ.lastErr > 0 ? Math.log10(summ.lastErr + 1e-16) : -16
  const res =
    summ.residual != null && summ.residual > 0 ? Math.log10(summ.residual + 1e-16) : -16
  return (
    summ.iters +
    0.001 * (summ.cost.f + 2 * summ.cost.df + summ.cost.g) +
    0.02 * (err + 16) +
    0.12 * (res + 16)
  )
}

export function pickBestMethodFromCompare(compareRows) {
  if (!compareRows?.length) return null
  const summaries = compareRows.map(summarizeCompareRow)
  const candidates = summaries.filter((s) => s.ok && s.status === 'ok')
  if (!candidates.length) return { best: null, summaries, reason: 'Ningún método terminó en estado «ok» con los datos actuales.' }
  let best = candidates[0]
  let bestScore = compareScore(best)
  for (let i = 1; i < candidates.length; i++) {
    const sc = compareScore(candidates[i])
    if (sc < bestScore) {
      bestScore = sc
      best = candidates[i]
    }
  }
  return {
    best,
    summaries,
    reason: `Menor puntuación compuesta (iteraciones + evaluaciones contadas en servidor + errores de paso y residual). Mejor candidato: ${best.label}.`,
  }
}

export function buildRootsReproJson({ expr, fields, xmin, xmax, highlightContractive = false }) {
  return JSON.stringify(
    {
      smartroots_repro: 1,
      expression: String(expr || '').trim(),
      interval_bracket: { a: fields.a, b: fields.b },
      seeds: { x0: fields.x0, x1: fields.x1 },
      graph_window: { xmin, xmax },
      fixed_point_g: fields.gExpr,
      highlight_contractive: Boolean(highlightContractive),
      tolerance: fields.tolStr,
      max_iterations: fields.maxIterStr,
    },
    null,
    2,
  )
}

/** Viabilidad de bisección / posición falsa según /api/interval_sign */
export function bracketMethodsViable(signCheck) {
  if (!signCheck || typeof signCheck !== 'object') return null
  if (signCheck.error) return false
  if (signCheck.finite_f_a === false || signCheck.finite_f_b === false) return false
  return Boolean(signCheck.opposite_signs)
}

/**
 * Informe Markdown (sin gráficas) para pegar en GitHub / informe.
 * @param {{ expr: string, fields: object, xmin: string, xmax: string, compareRows: any[] | null, signCheck: object | null }} p
 */
export function buildRootsMarkdownReport(p) {
  const { expr, fields, xmin, xmax, compareRows, signCheck, highlightContractive } = p
  const lines = [
    '# SmartRoots — informe numérico',
    '',
    '## Parámetros',
    '',
    `- **f(x)** = \`${String(expr || '').trim()}\``,
    `- **a, b** = ${fields.a}, ${fields.b}`,
    `- **x₀, x₁** = ${fields.x0}, ${fields.x1}`,
    `- **Ventana gráfico** [x mín, x máx] = ${xmin}, ${xmax}`,
    `- **g(x) punto fijo** = \`${String(fields.gExpr || '').trim()}\``,
    `- **Priorizar punto fijo contractivo** = ${highlightContractive ? 'Sí' : 'No'}`,
    `- **Tolerancia / máx. iter.** = ${fields.tolStr}, ${fields.maxIterStr}`,
    '',
  ]
  if (signCheck && typeof signCheck === 'object' && !signCheck.error) {
    lines.push(
      '## Cambio de signo en [a, b]',
      '',
      `| f(a) | f(b) | ¿Signo opuesto? |`,
      `| --- | --- | --- |`,
      `| ${signCheck.f_a} | ${signCheck.f_b} | ${signCheck.opposite_signs ? 'Sí' : 'No'} |`,
      '',
    )
  }
  if (compareRows?.length) {
    lines.push('## Comparación de métodos', '', '| Método | Estado | Raíz | Iter | #f | #f′ | #g | Residual | Parada |', '| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |')
    for (const row of compareRows) {
      const s = summarizeCompareRow(row)
      const root = row.ok && row.data ? String(row.data.root) : '—'
      const res = s.residual != null && Number.isFinite(s.residual) ? s.residual.toExponential(4) : '—'
      const par = s.stopReasonLabel || '—'
      lines.push(
        `| ${row.label} | ${row.ok ? row.data?.status ?? '—' : 'error'} | ${root} | ${s.iters} | ${s.cost.f} | ${s.cost.df} | ${s.cost.g} | ${res} | ${par} |`,
      )
    }
    lines.push('')
  }
  lines.push('_Generado por SmartRoots; revisa residual y criterios de parada en la app._', '')
  return lines.join('\n')
}

/** Serializa estado mínimo en query (expresión corta). Devuelve string sin `?` o null si es demasiado largo. */
export function rootsStateToQueryString(state) {
  const e = String(state.expr ?? '').trim()
  if (e.length > 700) return null
  const p = new URLSearchParams()
  p.set('e', e)
  p.set('a', String(state.a ?? ''))
  p.set('b', String(state.b ?? ''))
  p.set('x0', String(state.x0 ?? ''))
  p.set('x1', String(state.x1 ?? ''))
  p.set('xm', String(state.xmin ?? ''))
  p.set('xx', String(state.xmax ?? ''))
  p.set('g', String(state.gExpr ?? ''))
  p.set('tol', String(state.tolStr ?? ''))
  p.set('mi', String(state.maxIterStr ?? ''))
  if (state.highlightContractive) p.set('hc', '1')
  const s = p.toString()
  if (s.length > 2000) return null
  return s
}

export function queryStringToRootsState(search) {
  const raw = search.startsWith('?') ? search.slice(1) : search
  const p = new URLSearchParams(raw)
  if (!p.get('e')) return null
  return {
    expr: p.get('e') || '',
    a: p.get('a') ?? '',
    b: p.get('b') ?? '',
    x0: p.get('x0') ?? '',
    x1: p.get('x1') ?? '',
    xmin: p.get('xm') ?? '',
    xmax: p.get('xx') ?? '',
    gExpr: p.get('g') ?? '',
    tolStr: p.get('tol') ?? '',
    maxIterStr: p.get('mi') ?? '',
    highlightContractive: p.get('hc') === '1',
  }
}

/** Avisos sobre nodos (solo ℝ, ordenados por x). */
export function interpNodeHints(xs) {
  if (!xs?.length || xs.length < 2) return []
  const hints = []
  const sorted = [...xs].filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (sorted.length !== xs.length) return hints
  const span = sorted[sorted.length - 1] - sorted[0] || 1
  const gaps = []
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1])
  const minG = Math.min(...gaps)
  const maxG = Math.max(...gaps)
  if (minG / span < 0.02) {
    hints.push('Hay nodos muy próximos en x: el interpolante puede volverse mal condicionado.')
  }
  if (maxG / minG > 12 && sorted.length >= 4) {
    hints.push('El espaciado en x es muy desigual: conviene revisar si es intencional o probar nodos más equilibrados / Chebyshev en el intervalo.')
  }
  if (sorted.length >= 10) {
    hints.push('Muchos nodos: si son uniformes en un intervalo amplio, vigila el fenómeno de Runge; Chebyshev suele reducir oscilaciones.')
  }
  return hints
}
