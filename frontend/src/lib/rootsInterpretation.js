/**
 * Genera viñetas de interpretación pedagógica a partir de tablas de iteración y recomendación.
 * No valida teoría de convergencia: solo describe patrones (error monótono, último error, etc.).
 */
function lastFiniteError(rows) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const e = rows[i]?.error
    if (typeof e === 'number' && Number.isFinite(e)) return e
  }
  return null
}

export function rootsInterpretationBullets({ solve, rec }) {
  const out = []
  if (!solve?.iterations?.length) return out

  const rows = solve.iterations
  const errs = rows.map((r) => r.error).filter((e) => typeof e === 'number' && Number.isFinite(e))
  if (errs.length >= 3) {
    let nonInc = 0
    for (let i = 1; i < errs.length; i++) {
      if (errs[i] > errs[i - 1] * 1.02) nonInc++
    }
    if (nonInc === 0) {
      out.push('El error en la tabla va bajando (o se mantiene): coherente con convergencia numérica.')
    } else if (nonInc <= errs.length * 0.3) {
      out.push('El error casi siempre baja; algún paso puede subir levemente según el método.')
    } else {
      out.push('El error no baja de forma estable: revisa semillas, intervalo o si el método aplica a esta f(x).')
    }
  }

  const le = lastFiniteError(rows)
  if (le !== null && le < 1e-8) {
    out.push('El último error es muy pequeño: la tolerancia numérica se cumple en la práctica.')
  }

  if (rec?.bracket && Number.isFinite(rec.bracket.a) && Number.isFinite(rec.bracket.b)) {
    out.push('Hay intervalo con cambio de signo detectado: los métodos de intervalo tienen sentido sobre ℝ.')
  }

  if (solve.status === 'ok') {
    out.push('Estado «ok»: el algoritmo terminó con criterio de parada habitual (tolerancia o máximo de pasos).')
  }

  return out.slice(0, 4)
}
