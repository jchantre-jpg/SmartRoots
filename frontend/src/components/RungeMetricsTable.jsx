/**
 * Tabla resumen de errores máximos Runge: nodos uniformes vs Chebyshev y factores comparativos.
 */
function fmt(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v === 0) return '0'
    const ax = Math.abs(v)
    if (ax < 1e-6 || ax > 1e4) return v.toExponential(4)
    return v.toPrecision(6)
  }
  return String(v)
}

export function RungeMetricsTable({ metrics }) {
  if (!metrics) return null
  const errU = metrics.max_abs_error_uniform
  const errC = metrics.max_abs_error_chebyshev
  const better = errC < errU ? 'Chebyshev' : 'Uniformes'
  const factorChebVsUniform = errU / (errC + 1e-30)
  const factorUniformVsCheb = errC / (errU + 1e-30)

  return (
    <div className="sr-table-zone mt-4 overflow-auto rounded-2xl border sr-border-accent ring-1 ring-white/10 [html.sr-light_&]:ring-slate-500/35">
      <table className="sr-workspace-text w-full min-w-[320px] border-collapse text-left text-sm text-slate-200 [html.sr-light_&]:text-slate-900">
        <thead>
          <tr className="border-b border-white/10 bg-slate-950/90">
            <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Métrica</th>
            <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Nodos uniformes</th>
            <th className="px-3 py-2.5 font-semibold sr-text-accent-soft">Nodos Chebyshev</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/5">
            <td className="sr-workspace-text-muted px-3 py-2">Error máx. |f − P|</td>
            <td className="px-3 py-2 font-mono tabular-nums">{fmt(metrics.max_abs_error_uniform)}</td>
            <td className="px-3 py-2 font-mono tabular-nums">{fmt(metrics.max_abs_error_chebyshev)}</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="sr-workspace-text-muted px-3 py-2">RMS √(media (f − P)²)</td>
            <td className="px-3 py-2 font-mono tabular-nums">{fmt(metrics.rms_error_uniform)}</td>
            <td className="px-3 py-2 font-mono tabular-nums">{fmt(metrics.rms_error_chebyshev)}</td>
          </tr>
          {metrics.x_probe !== undefined ? (
            <tr>
              <td className="sr-workspace-text-muted px-3 py-2">
                |error| en x = {fmt(metrics.x_probe)} (f real vs P)
              </td>
              <td className="px-3 py-2 font-mono tabular-nums">{fmt(metrics.abs_error_uniform_at_probe)}</td>
              <td className="px-3 py-2 font-mono tabular-nums">{fmt(metrics.abs_error_chebyshev_at_probe)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <p className="sr-workspace-text-muted border-t border-white/10 px-3 py-2 text-xs [html.sr-light_&]:border-slate-200">
        Malla de {metrics.n_samples ?? '—'} puntos en [−1, 1], {metrics.n_nodes ?? '—'} nodos. Menor error máximo ahora:{' '}
        <span className="font-medium sr-text-accent-bright">{better}</span>.
        {better === 'Chebyshev' && factorChebVsUniform > 2 ? (
          <span className="sr-state-ok mt-1 block">
            Chebyshev reduce el error máximo de forma clara frente a uniformes (≈{factorChebVsUniform.toFixed(1)}× menor |f−P|∞).
          </span>
        ) : better === 'Uniformes' && factorUniformVsCheb > 2 ? (
          <span className="sr-state-warn mt-1 block">
            En esta malla los uniformes tienen menor error máximo (≈{factorUniformVsCheb.toFixed(1)}×); no extrapoles: depende de n y de la función.
          </span>
        ) : (
          <span className="sr-workspace-text-faint mt-1 block">
            Conclusión práctica: en Runge clásico Chebyshev suele ser la referencia; contrasta siempre error máximo y RMS con tus propios nodos.
          </span>
        )}
      </p>
    </div>
  )
}
