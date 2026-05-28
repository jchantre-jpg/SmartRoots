/**
 * Coeficientes de polinomio en orden mayor → menor grado: utilidades para la UI de polinomios.
 * - `effectiveDegreeFromCoeffs`: elimina ceros superiores y devuelve grado real.
 * - `clusterRootMultiplicities`: agrupa raíces cercanas (tolerancia) para sugerir multiplicidad aproximada.
 */
export function effectiveDegreeFromCoeffs(values) {
  if (!values?.length) return { degree: 0, trimmed: [] }
  let v = [...values]
  while (v.length > 1 && Math.abs(v[0]) < 1e-12) v.shift()
  return { degree: Math.max(0, v.length - 1), trimmed: v }
}

export function clusterRootMultiplicities(roots, eps = 1e-5) {
  if (!roots?.length) return []
  const sorted = [...roots].filter((r) => typeof r === 'number' && Number.isFinite(r)).sort((a, b) => a - b)
  const clusters = []
  for (const r of sorted) {
    const last = clusters[clusters.length - 1]
    if (!last || Math.abs(r - last.mean) > eps * (1 + Math.abs(r))) {
      clusters.push({ sum: r, count: 1, mean: r })
    } else {
      last.sum += r
      last.count += 1
      last.mean = last.sum / last.count
    }
  }
  return clusters.map((c) => ({ value: c.mean, mult: c.count }))
}
